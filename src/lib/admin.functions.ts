import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const AUTH_DOMAIN = "vikingos.fc";
export const emailForUsername = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@${AUTH_DOMAIN}`;

const usernameSchema = z
  .string()
  .trim()
  .min(2, "El usuario debe tener al menos 2 caracteres")
  .max(30)
  .regex(/^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+$/, "El usuario solo admite letras y números");

/** Nombre con mayúscula inicial + al menos un número, p. ej. Juancarlos1 */
export const adminPasswordRule = (password: string, name: string) => {
  const base = name.trim().split(/\s+/)[0] ?? "";
  const expected = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return (
    password.startsWith(expected) &&
    /\d/.test(password) &&
    password.length >= expected.length + 1
  );
};

type Role = "master" | "admin" | "vikingo";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertRole(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> },
  userId: string,
  role: "master" | "staff",
) {
  if (role === "master") {
    const { data } = await supabase.rpc("is_master", { _user_id: userId });
    if (!data) throw new Error("Solo el MASTER puede realizar esta acción");
  } else {
    const { data } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!data) throw new Error("No tienes permisos para esta acción");
  }
}

async function createAccount(input: {
  username: string;
  displayName: string;
  password: string;
  role: Role;
}) {
  const db = await admin();
  const email = emailForUsername(input.username);

  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .ilike("username", input.username)
    .maybeSingle();
  if (existing) throw new Error(`El usuario "${input.username}" ya existe. Define uno diferente.`);

  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { username: input.username, display_name: input.displayName },
  });
  if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear la cuenta");

  const uid = created.user.id;
  const { error: pErr } = await db
    .from("profiles")
    .insert({ id: uid, username: input.username, display_name: input.displayName });
  if (pErr) {
    await db.auth.admin.deleteUser(uid);
    throw new Error(pErr.message);
  }
  const { error: rErr } = await db.from("user_roles").insert({ user_id: uid, role: input.role });
  if (rErr) throw new Error(rErr.message);
  return uid;
}

/** Crea la cuenta MASTER inicial una sola vez. Idempotente. */
export const bootstrapMaster = createServerFn({ method: "POST" }).handler(async () => {
  const db = await admin();
  const { data: existing } = await db
    .from("user_roles")
    .select("id")
    .eq("role", "master")
    .maybeSingle();
  if (existing) return { created: false };
  await createAccount({
    username: "master",
    displayName: "Master",
    password: "master123",
    role: "master",
  });
  return { created: true };
});

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { displayName: string; username: string; password: string }) =>
    z
      .object({
        displayName: z.string().trim().min(2).max(60),
        username: usernameSchema,
        password: z.string().min(4).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "master");
    if (!adminPasswordRule(data.password, data.displayName)) {
      throw new Error(
        "La contraseña inicial debe ser el nombre con mayúscula inicial más al menos un número.",
      );
    }
    const id = await createAccount({ ...data, role: "admin" });
    return { id };
  });

export const createVikingoUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { displayName: string; username: string; playerId?: string }) =>
    z
      .object({
        displayName: z.string().trim().min(2).max(60),
        username: usernameSchema,
        playerId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "staff");
    const id = await createAccount({
      username: data.username,
      displayName: data.displayName,
      password: "Vikingos",
      role: "vikingo",
    });
    if (data.playerId) {
      const db = await admin();
      const { error } = await db.from("players").update({ profile_id: id }).eq("id", data.playerId);
      if (error) throw new Error(error.message);
    }
    return { id };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(4).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "master");
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAccountActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; active: boolean }) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "master");
    const db = await admin();
    const { data: target } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((target ?? []).some((r) => r.role === "master")) {
      throw new Error("La cuenta MASTER no puede desactivarse");
    }
    const { error } = await db
      .from("profiles")
      .update({ active: data.active })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cambio de contraseña del propio usuario autenticado. */
export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { password: string }) =>
    z.object({ password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(context.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
