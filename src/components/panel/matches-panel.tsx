import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConfirmButton,
  Field,
  MediaPicker,
  PanelCard,
  fromLocalInput,
  toLocalInput,
} from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { useMatches, useSeasons, type Match } from "@/lib/queries";

type Draft = {
  id?: string;
  opponent: string;
  opponent_crest_url: string | null;
  is_home: boolean;
  kickoff: string;
  venue: string;
  matchday: string;
  season_id: string;
  preview: string;
  status: Match["status"];
  published: boolean;
};

const empty: Draft = {
  opponent: "",
  opponent_crest_url: null,
  is_home: true,
  kickoff: "",
  venue: "",
  matchday: "",
  season_id: "",
  preview: "",
  status: "programado",
  published: true,
};

export function MatchesPanel() {
  const qc = useQueryClient();
  const { data: matches = [] } = useMatches();
  const { data: seasons = [] } = useSeasons();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft || !draft.opponent.trim()) { toast.error("Indica el equipo rival"); return; }
    setBusy(true);
    const payload = {
      opponent: draft.opponent.trim(),
      opponent_crest_url: draft.opponent_crest_url,
      is_home: draft.is_home,
      kickoff: fromLocalInput(draft.kickoff),
      venue: draft.venue.trim() || null,
      matchday: draft.matchday.trim() || null,
      season_id: draft.season_id || null,
      preview: draft.preview.trim() || null,
      status: draft.status,
      published: draft.published,
    };
    const { error } = draft.id
      ? await supabase.from("matches").update(payload).eq("id", draft.id)
      : await supabase.from("matches").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(draft.id ? "Partido actualizado" : "Partido programado");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["matches"] });
  }

  async function remove(id: string) {
    await supabase.from("match_events").delete().eq("match_id", id);
    await supabase.from("match_lineup").delete().eq("match_id", id);
    await supabase.from("media").update({ match_id: null }).eq("match_id", id);
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Partido eliminado");
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["media"] });
  }

  return (
    <PanelCard title="Partidos">
      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogTrigger asChild>
          <Button onClick={() => setDraft({ ...empty })}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo partido
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar partido" : "Nuevo partido"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <Field label="Equipo rival">
                <Input
                  value={draft.opponent}
                  onChange={(e) => setDraft({ ...draft, opponent: e.target.value })}
                />
              </Field>
              <MediaPicker
                folder="rivales"
                label="Escudo del rival"
                value={draft.opponent_crest_url}
                onChange={(path) => setDraft({ ...draft, opponent_crest_url: path })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha y hora">
                  <Input
                    type="datetime-local"
                    value={draft.kickoff}
                    onChange={(e) => setDraft({ ...draft, kickoff: e.target.value })}
                  />
                </Field>
                <Field label="Jornada">
                  <Input
                    value={draft.matchday}
                    onChange={(e) => setDraft({ ...draft, matchday: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Sede / cancha">
                <Input
                  value={draft.venue}
                  onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temporada">
                  <Select
                    value={draft.season_id}
                    onValueChange={(v) => setDraft({ ...draft, season_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estatus">
                  <Select
                    value={draft.status}
                    onValueChange={(v) => setDraft({ ...draft, status: v as Match["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["programado", "finalizado", "aplazado", "cancelado"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Previa">
                <Textarea
                  rows={3}
                  value={draft.preview}
                  onChange={(e) => setDraft({ ...draft, preview: e.target.value })}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">Jugamos como local</span>
                <Switch
                  checked={draft.is_home}
                  onCheckedChange={(v) => setDraft({ ...draft, is_home: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">Visible en el sitio</span>
                <Switch
                  checked={draft.published}
                  onCheckedChange={(v) => setDraft({ ...draft, published: v })}
                />
              </div>
              <Button className="w-full" onClick={save}>
                Guardar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay partidos registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  vs {m.opponent} {m.is_home ? "(L)" : "(V)"}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {m.kickoff
                    ? format(new Date(m.kickoff), "d MMM yyyy HH:mm", { locale: es })
                    : "Sin fecha"}{" "}
                  · {m.status}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setDraft({
                    id: m.id,
                    opponent: m.opponent,
                    opponent_crest_url: m.opponent_crest_url,
                    is_home: m.is_home,
                    kickoff: toLocalInput(m.kickoff),
                    venue: m.venue ?? "",
                    matchday: m.matchday ?? "",
                    season_id: m.season_id ?? "",
                    preview: m.preview ?? "",
                    status: m.status,
                    published: m.published,
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
