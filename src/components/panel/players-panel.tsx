import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { StorageImage } from "@/components/vk/media";
import { Field, MediaPicker, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { POSITIONS } from "@/lib/brand";
import { usePlayers, type Player } from "@/lib/queries";

type Draft = {
  id?: string;
  full_name: string;
  nickname: string;
  jersey_number: string;
  position: string;
  photo_url: string | null;
  joined_on: string;
  bio: string;
  active: boolean;
};

const empty: Draft = {
  full_name: "",
  nickname: "",
  jersey_number: "",
  position: "",
  photo_url: null,
  joined_on: "",
  bio: "",
  active: true,
};

function toDraft(p: Player): Draft {
  return {
    id: p.id,
    full_name: p.full_name,
    nickname: p.nickname ?? "",
    jersey_number: p.jersey_number != null ? String(p.jersey_number) : "",
    position: p.position ?? "",
    photo_url: p.photo_url,
    joined_on: p.joined_on ?? "",
    bio: p.bio ?? "",
    active: p.active,
  };
}

export function PlayersPanel() {
  const qc = useQueryClient();
  const { data: players = [] } = usePlayers();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft || !draft.full_name.trim()) {
      toast.error("El nombre completo es obligatorio");
      return;
    }
    setBusy(true);
    const payload = {
      full_name: draft.full_name.trim(),
      nickname: draft.nickname.trim() || null,
      jersey_number: draft.jersey_number ? Number(draft.jersey_number) : null,
      position: draft.position || null,
      photo_url: draft.photo_url,
      joined_on: draft.joined_on || null,
      bio: draft.bio.trim() || null,
      active: draft.active,
    };
    const { error } = draft.id
      ? await supabase.from("players").update(payload).eq("id", draft.id)
      : await supabase.from("players").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(draft.id ? "Jugador actualizado" : "Jugador registrado");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["players"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Jugador eliminado");
    qc.invalidateQueries({ queryKey: ["players"] });
  }

  return (
    <PanelCard title="Jugadores">
      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogTrigger asChild>
          <Button onClick={() => setDraft({ ...empty })}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo jugador
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar jugador" : "Nuevo jugador"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <Field label="Nombre completo">
                <Input
                  value={draft.full_name}
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                />
              </Field>
              <Field label="Apodo">
                <Input
                  value={draft.nickname}
                  onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dorsal">
                  <Input
                    inputMode="numeric"
                    value={draft.jersey_number}
                    onChange={(e) => setDraft({ ...draft, jersey_number: e.target.value })}
                  />
                </Field>
                <Field label="Posición">
                  <Select
                    value={draft.position}
                    onValueChange={(v) => setDraft({ ...draft, position: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <MediaPicker
                folder="jugadores"
                label="Fotografía"
                value={draft.photo_url}
                onChange={(path) => setDraft({ ...draft, photo_url: path })}
              />
              <Field label="En el club desde">
                <Input
                  type="date"
                  value={draft.joined_on}
                  onChange={(e) => setDraft({ ...draft, joined_on: e.target.value })}
                />
              </Field>
              <Field label="Semblanza">
                <Textarea
                  rows={3}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">Jugador activo</span>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                />
              </div>
              <Button className="w-full" onClick={save} disabled={busy}>
                Guardar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay jugadores registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <StorageImage path={p.photo_url} alt={p.full_name} className="h-11 w-11 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {p.jersey_number != null && `${p.jersey_number} · `}
                  {p.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.position ?? "Sin posición"} {p.active ? "" : "· inactivo"}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDraft(toDraft(p))}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
