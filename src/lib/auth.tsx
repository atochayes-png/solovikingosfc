import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "master" | "admin" | "vikingo" | "visitante";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  active: boolean;
};

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
  isStaff: boolean;
  isMaster: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const resolveAuthEmail = (identifier: string) => {
  const clean = identifier.trim();
  if (clean.includes("@")) {
    return clean.toLowerCase();
  }
  return `${clean.toLowerCase().replace(/[^a-z0-9]/g, "")}@vikingos.fc`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>("visitante");
  const [loading, setLoading] = useState(true);

  async function load(uid: string | undefined) {
    if (!uid) {
      setProfile(null);
      setRole("visitante");
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, active")
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile) ?? null);
    const roles = (r ?? []).map((x) => x.role as Role);
    setRole(
      roles.includes("master")
        ? "master"
        : roles.includes("admin")
          ? "admin"
          : roles.includes("vikingo")
            ? "vikingo"
            : "visitante",
    );
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await load(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(s);
      void load(s?.user.id);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      role,
      loading,
      isStaff: role === "master" || role === "admin",
      isMaster: role === "master",
      async signIn(username, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: resolveAuthEmail(username),
          password,
        });
        if (error) throw new Error("Usuario o contraseña incorrectos");
        const { data: p } = await supabase
          .from("profiles")
          .select("active")
          .eq("id", data.user.id)
          .maybeSingle();
        if (p && p.active === false) {
          await supabase.auth.signOut();
          throw new Error("Esta cuenta está desactivada");
        }
        setSession(data.session);
        await load(data.user.id);
      },
      async signOut() {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setRole("visitante");
      },
      async refresh() {
        const { data } = await supabase.auth.getSession();
        await load(data.session?.user.id);
      },
    }),
    [session, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
