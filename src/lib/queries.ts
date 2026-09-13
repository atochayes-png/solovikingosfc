import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DisplayMode } from "@/components/vk/media";

export type Season = { id: string; name: string; is_current: boolean };

export type Player = {
  id: string;
  full_name: string;
  nickname: string | null;
  jersey_number: number | null;
  position: string | null;
  photo_url: string | null;
  photo_display_mode: DisplayMode;
  active: boolean;
  joined_on: string | null;
  bio: string | null;
  profile_id: string | null;
};

export type Match = {
  id: string;
  season_id: string | null;
  matchday: string | null;
  opponent: string;
  opponent_crest_url: string | null;
  is_home: boolean;
  kickoff: string | null;
  venue: string | null;
  preview: string | null;
  status: "programado" | "finalizado" | "aplazado" | "cancelado";
  goals_for: number | null;
  goals_against: number | null;
  chronicle: string | null;
  mvp_player_id: string | null;
  mvp_comment: string | null;
  vikingada_player_id: string | null;
  vikingada_title: string | null;
  vikingada_description: string | null;
  vikingada_media_url: string | null;
  vikingada_display_mode: DisplayMode;
  published: boolean;
};

export type MatchEvent = {
  id: string;
  match_id: string;
  player_id: string | null;
  event_type: "gol" | "asistencia" | "amarilla" | "roja";
  minute: number | null;
  note: string | null;
};

export type ClubSettings = {
  id: boolean;
  name: string;
  founded: string;
  league: string;
  city: string;
  history: string | null;
  identity: string | null;
  venue_info: string | null;
  sponsors: string | null;
};

export type MediaItem = {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  media_type: "image" | "video";
  category: string | null;
  event_name: string | null;
  season_id: string | null;
  match_id: string | null;
  uploaded_by: string | null;
  featured: boolean;
  display_mode: DisplayMode;
  created_at: string;
};

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("name", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Season[];
    },
  });
}

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Player[];
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Match | null;
    },
  });
}

export function useMatchEvents(matchId?: string) {
  return useQuery({
    queryKey: ["match_events", matchId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("match_events").select("*");
      if (matchId) q = q.eq("match_id", matchId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MatchEvent[];
    },
  });
}

export function useLineups(matchId?: string) {
  return useQuery({
    queryKey: ["match_lineup", matchId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("match_lineup").select("match_id, player_id");
      if (matchId) q = q.eq("match_id", matchId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { match_id: string; player_id: string }[];
    },
  });
}

export function useClub() {
  return useQuery({
    queryKey: ["club"],
    queryFn: async () => {
      const { data, error } = await supabase.from("club_settings").select("*").maybeSingle();
      if (error) throw error;
      return (data ?? null) as ClubSettings | null;
    },
  });
}

export function useMediaLibrary() {
  return useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });
}

export type SiteImageKey = "hero" | "club_logo" | "club_team" | "club_kit" | "club_pitch";

export type SiteImage = {
  key: SiteImageKey;
  path: string;
  display_mode: DisplayMode;
  updated_at: string;
};

export function useSiteImages() {
  return useQuery({
    queryKey: ["site_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("key,path,display_mode,updated_at");
      if (error) throw error;
      const map: Partial<Record<SiteImageKey, SiteImage>> = {};
      for (const row of (data ?? []) as SiteImage[]) map[row.key] = row;
      return map;
    },
    staleTime: 60_000,
  });
}

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  destination_url: string;
  is_active: boolean;
  display_order: number;
};

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("id,name,logo_url,destination_url,is_active,display_order")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Sponsor[];
    },
  });
}

export type PlayerTotals = {
  pj: number;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  mvp: number;
};

export function emptyTotals(): PlayerTotals {
  return { pj: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvp: 0 };
}

export function computePlayerTotals(
  matches: Match[],
  events: MatchEvent[],
  lineups: { match_id: string; player_id: string }[],
  seasonId?: string | null,
) {
  const finished = matches.filter(
    (m) => m.status === "finalizado" && (!seasonId || m.season_id === seasonId),
  );
  const ids = new Set(finished.map((m) => m.id));
  const totals = new Map<string, PlayerTotals>();
  const get = (pid: string) => {
    if (!totals.has(pid)) totals.set(pid, emptyTotals());
    return totals.get(pid)!;
  };

  for (const l of lineups) if (ids.has(l.match_id)) get(l.player_id).pj += 1;
  for (const e of events) {
    if (!e.player_id || !ids.has(e.match_id)) continue;
    const t = get(e.player_id);
    if (e.event_type === "gol") t.goles += 1;
    if (e.event_type === "asistencia") t.asistencias += 1;
    if (e.event_type === "amarilla") t.amarillas += 1;
    if (e.event_type === "roja") t.rojas += 1;
  }
  for (const m of finished) if (m.mvp_player_id) get(m.mvp_player_id).mvp += 1;
  return totals;
}

export function computeClubTotals(matches: Match[], seasonId?: string | null) {
  const finished = matches.filter(
    (m) =>
      m.status === "finalizado" &&
      m.goals_for !== null &&
      m.goals_against !== null &&
      (!seasonId || m.season_id === seasonId),
  );
  let pg = 0,
    pe = 0,
    pp = 0,
    gf = 0,
    gc = 0;
  for (const m of finished) {
    const f = m.goals_for ?? 0;
    const a = m.goals_against ?? 0;
    gf += f;
    gc += a;
    if (f > a) pg += 1;
    else if (f === a) pe += 1;
    else pp += 1;
  }
  return {
    pj: finished.length,
    pg,
    pe,
    pp,
    gf,
    gc,
    dg: gf - gc,
    pts: pg * 3 + pe,
  };
}
