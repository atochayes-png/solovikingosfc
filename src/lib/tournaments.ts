import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TournamentStatus = "preparacion" | "activo" | "finalizado";
export type TeamStatus = "pendiente" | "activo" | "inactivo";
export type RegStatus = "pendiente" | "aprobado" | "rechazado" | "inactivo";

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  season: string | null;
  category: string | null;
  venue: string | null;
  start_date: string | null;
  status: TournamentStatus;
  registration_fee: number | null;
  referee_fee: number | null;
};

export type Team = {
  id: string;
  tournament_id: string;
  name: string;
  logo_url: string | null;
  rep_name: string | null;
  rep_phone: string | null;
  rep_email: string | null;
  rep_user_id: string | null;
  status: TeamStatus;
};

export type Registration = {
  id: string;
  team_id: string;
  person_id: string;
  jersey_number: number | null;
  photo_url: string | null;
  document_url: string | null;
  status: RegStatus;
  created_at: string;
  person: { id: string; full_name: string; document_number: string | null } | null;
};

export const TOURNAMENT_STATUS: Record<TournamentStatus, string> = {
  preparacion: "Preparación",
  activo: "Activo",
  finalizado: "Finalizado",
};
export const TEAM_STATUS: Record<TeamStatus, string> = {
  pendiente: "Pendiente",
  activo: "Activo",
  inactivo: "Inactivo",
};
export const REG_STATUS: Record<RegStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  inactivo: "Inactivo",
};

export function statusTone(s: string) {
  if (s === "activo" || s === "aprobado") return "bg-primary text-primary-foreground";
  if (s === "rechazado") return "bg-destructive text-destructive-foreground";
  if (s === "pendiente" || s === "preparacion") return "bg-accent text-accent-foreground";
  return "bg-secondary text-muted-foreground";
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tournament[];
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Tournament | null;
    },
  });
}

export function useTournamentRole(id: string, uid?: string | null, isMaster?: boolean) {
  return useQuery({
    queryKey: ["tournament_role", id, uid],
    enabled: !!uid,
    queryFn: async () => {
      if (isMaster) return { manager: true };
      const { data } = await supabase
        .from("tournament_admins")
        .select("id")
        .eq("tournament_id", id)
        .eq("user_id", uid!)
        .maybeSingle();
      return { manager: !!data };
    },
  });
}

export function useTeams(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament_teams", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
}

export function useRegistrations(teamIds: string[]) {
  return useQuery({
    queryKey: ["team_registrations", teamIds.slice().sort().join(",")],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_registrations")
        .select("*, person:sport_people(id, full_name, document_number)")
        .in("team_id", teamIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Registration[];
    },
  });
}

export function useLeagueAdmins(tournamentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["tournament_admins", tournamentId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_admins")
        .select("id, user_id, profile:profiles(username, display_name)")
        .eq("tournament_id", tournamentId);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        user_id: string;
        profile: { username: string; display_name: string } | null;
      }[];
    },
  });
}

/** Busca una cuenta existente por usuario (no crea usuarios nuevos). */
export async function findProfileByUsername(username: string) {
  const u = username.trim().toLowerCase().replace(/^@/, "");
  if (!u) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", u)
    .maybeSingle();
  return data;
}

const BUCKET = "torneos";
export const MAX_DOC_MB = 8;

/** Sube a la carpeta del equipo en el almacenamiento privado de torneos. */
export async function uploadTeamFile(teamId: string, file: File, kind: string) {
  const ok = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!ok) throw new Error("Solo se admiten imágenes o PDF");
  if (file.size > MAX_DOC_MB * 1024 * 1024) throw new Error(`El archivo supera ${MAX_DOC_MB} MB`);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${teamId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedTeamFile(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export function useTeamFile(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    setUrl(null);
    if (path) signedTeamFile(path).then((u) => on && setUrl(u));
    return () => {
      on = false;
    };
  }, [path]);
  return url;
}
