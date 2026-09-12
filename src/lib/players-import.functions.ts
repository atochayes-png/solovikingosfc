import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAccount } from "@/lib/admin.functions";

const rowSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  shirtName: z.string().trim().min(1).max(40),
  jersey: z.number().int().min(0).max(999),
  position: z.string().trim().min(1).max(30),
  username: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9]+$/),
});

export type ImportResult = {
  created: number;
  failed: { fullName: string; reason: string }[];
};

/** Importa jugadores desde Excel. Solo MASTER y ADMINISTRADOR. Crea acceso VIKINGO. */
export const importPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rows: z.input<typeof rowSchema>[] }) =>
    z.object({ rows: z.array(rowSchema).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<ImportResult> => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("No tienes permisos para importar jugadores");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let created = 0;
    const failed: { fullName: string; reason: string }[] = [];

    for (const row of data.rows) {
      let uid: string | null = null;
      try {
        uid = await createAccount({
          username: row.username,
          displayName: row.shirtName,
          password: "Vikingos",
          role: "vikingo",
        });
        const { error } = await supabaseAdmin.from("players").insert({
          full_name: row.fullName,
          nickname: row.shirtName,
          jersey_number: row.jersey,
          position: row.position,
          active: true,
          profile_id: uid,
        });
        if (error) throw new Error(error.message);
        created += 1;
      } catch (e) {
        if (uid) {
          await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
          await supabaseAdmin.from("profiles").delete().eq("id", uid);
          await supabaseAdmin.auth.admin.deleteUser(uid);
        }
        failed.push({
          fullName: row.fullName,
          reason: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    }

    return { created, failed };
  });
