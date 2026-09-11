import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmButton, Field, MediaPicker, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import {
  useLineups,
  useMatchEvents,
  useMatches,
  usePlayers,
  type MatchEvent,
} from "@/lib/queries";

const EVENT_TYPES: MatchEvent["event_type"][] = ["gol", "asistencia", "amarilla", "roja"];

export function ResultsPanel() {
  const qc = useQueryClient();
  const { data: matches = [] } = useMatches();
  const { data: players = [] } = usePlayers();
  const [matchId, setMatchId] = useState<string>("");
  const { data: events = [] } = useMatchEvents(matchId || undefined);
  const { data: lineups = [] } = useLineups(matchId || undefined);

  const match = matches.find((m) => m.id === matchId);

  const [gf, setGf] = useState("");
  const [ga, setGa] = useState("");
  const [chronicle, setChronicle] = useState("");
  const [mvp, setMvp] = useState("");
  const [mvpComment, setMvpComment] = useState("");
  const [vkPlayer, setVkPlayer] = useState("");
  const [vkTitle, setVkTitle] = useState("");
  const [vkDesc, setVkDesc] = useState("");
  const [vkMedia, setVkMedia] = useState<string | null>(null);

  const [evType, setEvType] = useState<MatchEvent["event_type"]>("gol");
  const [evPlayer, setEvPlayer] = useState("");
  const [evMinute, setEvMinute] = useState("");
  const [busy, setBusy] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    if (!match) return;
    setGf(match.goals_for != null ? String(match.goals_for) : "");
    setGa(match.goals_against != null ? String(match.goals_against) : "");
    setChronicle(match.chronicle ?? "");
    setMvp(match.mvp_player_id ?? "");
    setMvpComment(match.mvp_comment ?? "");
    setVkPlayer(match.vikingada_player_id ?? "");
    setVkTitle(match.vikingada_title ?? "");
    setVkDesc(match.vikingada_description ?? "");
    setVkMedia(match.vikingada_media_url ?? null);
  }, [matchId, match]);

  async function saveResult() {
    if (!matchId) return;
    if (gf === "" || ga === "") {
      toast.error("Captura el marcador de ambos equipos");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("matches")
      .update({
        status: "finalizado",
        goals_for: gf === "" ? null : Number(gf),
        goals_against: ga === "" ? null : Number(ga),
        chronicle: chronicle.trim() || null,
        mvp_player_id: mvp || null,
        mvp_comment: mvpComment.trim() || null,
        vikingada_player_id: vkPlayer || null,
        vikingada_title: vkTitle.trim() || null,
        vikingada_description: vkDesc.trim() || null,
        vikingada_media_url: vkMedia,
      })
      .eq("id", matchId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resultado publicado. Ficha, estadísticas e inicio actualizados.");
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["match", matchId] });
    qc.invalidateQueries({ queryKey: ["match_events"] });
  }

  async function addEvent() {
    if (!matchId || !evPlayer) { toast.error("Elige un jugador"); return; }
    setAddingEvent(true);
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: evPlayer,
      event_type: evType,
      minute: evMinute ? Number(evMinute) : null,
    });
    setAddingEvent(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Incidencia registrada");
    setEvMinute("");
    qc.invalidateQueries({ queryKey: ["match_events"] });
  }

  async function removeEvent(id: string) {
    const { error } = await supabase.from("match_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Incidencia eliminada");
    qc.invalidateQueries({ queryKey: ["match_events"] });
  }

  async function toggleLineup(playerId: string, on: boolean) {
    if (on) {
      const { error } = await supabase
        .from("match_lineup")
        .insert({ match_id: matchId, player_id: playerId });
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("match_lineup")
        .delete()
        .eq("match_id", matchId)
        .eq("player_id", playerId);
      if (error) { toast.error(error.message); return; }
    }
    qc.invalidateQueries({ queryKey: ["match_lineup"] });
  }

  const name = (id: string | null) => {
    const p = players.find((x) => x.id === id);
    return p ? p.nickname || p.full_name : "—";
  };

  return (
    <PanelCard title="Resultados e incidencias">
      <Field label="Partido">
        <Select value={matchId} onValueChange={setMatchId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un partido" />
          </SelectTrigger>
          <SelectContent>
            {matches.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                vs {m.opponent}
                {m.kickoff ? ` · ${format(new Date(m.kickoff), "d MMM", { locale: es })}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {!matchId ? (
        <p className="text-sm text-muted-foreground">
          Elige un partido para capturar marcador, incidencias y crónica.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Goles Vikingos">
              <Input inputMode="numeric" value={gf} onChange={(e) => setGf(e.target.value)} />
            </Field>
            <Field label="Goles rival">
              <Input inputMode="numeric" value={ga} onChange={(e) => setGa(e.target.value)} />
            </Field>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="eyebrow text-muted-foreground">Convocatoria</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {players
                .filter((p) => p.active)
                .map((p) => {
                  const on = lineups.some((l) => l.player_id === p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={on}
                        onCheckedChange={(v) => toggleLineup(p.id, v === true)}
                      />
                      <span>{p.nickname || p.full_name}</span>
                    </label>
                  );
                })}
              {players.length === 0 && (
                <p className="text-sm text-muted-foreground">Registra jugadores primero.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="eyebrow text-muted-foreground">Incidencias</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <Select
                value={evType}
                onValueChange={(v) => setEvType(v as MatchEvent["event_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={evPlayer} onValueChange={setEvPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Jugador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nickname || p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Minuto"
                inputMode="numeric"
                value={evMinute}
                onChange={(e) => setEvMinute(e.target.value)}
              />
              <Button onClick={addEvent} disabled={addingEvent}>
                {addingEvent ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Agregar
              </Button>
            </div>
            {events.length > 0 && (
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="w-24 capitalize text-muted-foreground">{e.event_type}</span>
                    <span className="flex-1 font-semibold">{name(e.player_id)}</span>
                    {e.minute != null && <span className="text-xs">{e.minute}'</span>}
                    <ConfirmButton
                      title="¿Eliminar esta incidencia?"
                      onConfirm={() => removeEvent(e.id)}
                    >
                      <Button size="icon" variant="ghost" aria-label="Eliminar incidencia">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </ConfirmButton>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="MVP del partido">
              <Select value={mvp} onValueChange={setMvp}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir jugador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nickname || p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Comentario del MVP">
              <Input value={mvpComment} onChange={(e) => setMvpComment(e.target.value)} />
            </Field>
          </div>

          <div className="rounded-lg border border-dashed border-accent p-4">
            <p className="eyebrow text-accent-foreground">La Vikingada de la Jornada</p>
            <div className="mt-3 space-y-3">
              <Field label="Título">
                <Input value={vkTitle} onChange={(e) => setVkTitle(e.target.value)} />
              </Field>
              <Field label="Protagonista">
                <Select value={vkPlayer} onValueChange={setVkPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nickname || p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Descripción">
                <Textarea rows={3} value={vkDesc} onChange={(e) => setVkDesc(e.target.value)} />
              </Field>
              <MediaPicker
                folder="vikingada"
                label="Foto o video"
                accept="image/*,video/*"
                value={vkMedia}
                onChange={(path) => setVkMedia(path)}
              />
            </div>
          </div>

          <Field label="Crónica del partido">
            <Textarea rows={5} value={chronicle} onChange={(e) => setChronicle(e.target.value)} />
          </Field>

          <Button className="w-full" onClick={saveResult}>
            Guardar resultado y publicar
          </Button>
        </div>
      )}
    </PanelCard>
  );
}
