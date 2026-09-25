import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function AttendanceCard({ matchId }: { matchId: string }) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const stats = useQuery({
    queryKey: ["attendance_stats", matchId],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("match_attendance_stats", { _match_id: matchId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { confirmed: row?.confirmed ?? 0, total: row?.total ?? 0 };
    },
  });

  const mine = useQuery({
    queryKey: ["attendance_mine", matchId, uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data: player } = await supabase
        .from("players")
        .select("id, active")
        .eq("profile_id", uid!)
        .maybeSingle();
      if (!player) return { playerId: null as string | null, active: false, confirmed: false };
      const { data } = await supabase
        .from("match_attendance")
        .select("id")
        .eq("match_id", matchId)
        .eq("player_id", player.id)
        .maybeSingle();
      return { playerId: player.id as string | null, active: player.active, confirmed: !!data };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["attendance_stats", matchId] });
    qc.invalidateQueries({ queryKey: ["attendance_mine", matchId] });
  };

  const toggle = async () => {
    const m = mine.data;
    if (!m?.playerId || busy) return;
    setBusy(true);
    const { error } = m.confirmed
      ? await supabase.from("match_attendance").delete().eq("match_id", matchId).eq("player_id", m.playerId)
      : await supabase.from("match_attendance").insert({ match_id: matchId, player_id: m.playerId });
    setBusy(false);
    if (error) {
      toast.error("No se pudo guardar tu asistencia. Intenta de nuevo.");
      return;
    }
    toast.success(m.confirmed ? "Confirmación retirada" : "¡Asistencia confirmada!");
    refresh();
  };

  const confirmed = stats.data?.confirmed ?? 0;
  const total = stats.data?.total ?? 0;
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow text-muted-foreground">Asistencia confirmada</p>
        <span className="font-display text-2xl font-black tabular-nums">{pct}%</span>
      </div>
      <Progress value={pct} className="mt-3 h-2.5" aria-label={`${pct}% de asistencia confirmada`} />

      <div className="mt-4">
        {!uid ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/acceso">Inicia sesión para confirmar</Link>
          </Button>
        ) : mine.isLoading ? null : mine.data?.playerId && mine.data.active ? (
          mine.data.confirmed ? (
            <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-5 w-5" /> Asistencia confirmada
              </p>
              <Button variant="ghost" size="sm" onClick={toggle} disabled={busy} className="w-full sm:w-auto">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Retirar confirmación
              </Button>
            </div>
          ) : (
            <Button onClick={toggle} disabled={busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Confirmar asistencia
            </Button>
          )
        ) : null}
      </div>
    </section>
  );
}
