import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StandingTeam = Database["public"]["Tables"]["standings_teams"]["Row"];
export type StandingsSettings = { points_per_win: number; tiebreakers: string[] };

export const TIEBREAKERS: { key: string; label: string }[] = [
  { key: "dg", label: "Diferencia de goles" },
  { key: "gf", label: "Más goles a favor" },
  { key: "gc", label: "Menos goles en contra" },
  { key: "g", label: "Más partidos ganados" },
  { key: "manual", label: "Orden manual del administrador" },
];

export function useStandings() {
  return useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const [t, s] = await Promise.all([
        supabase.from("standings_teams").select("*"),
        supabase.from("standings_settings").select("points_per_win, tiebreakers").maybeSingle(),
      ]);
      if (t.error) throw t.error;
      if (s.error) throw s.error;
      const settings: StandingsSettings = s.data ?? { points_per_win: 3, tiebreakers: [] };
      return { teams: sortStandings(t.data ?? [], settings.tiebreakers), settings };
    },
  });
}

export function sortStandings(teams: StandingTeam[], tiebreakers: string[]) {
  const val = (t: StandingTeam, k: string) => {
    switch (k) {
      case "dg": return t.gf - t.gc;
      case "gf": return t.gf;
      case "gc": return -t.gc;
      case "g": return t.g;
      case "manual": return -t.manual_order;
      default: return 0;
    }
  };
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    for (const k of tiebreakers) {
      const d = val(b, k) - val(a, k);
      if (d !== 0) return d;
    }
    return a.name.localeCompare(b.name, "es");
  });
}
