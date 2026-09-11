import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StorageMedia } from "@/components/vk/media";
import { ConfirmButton, Field, MediaPicker, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMatches, useMediaLibrary } from "@/lib/queries";

const CATEGORIES = ["Partidos", "Entrenamientos", "Celebraciones", "Torneos", "Histórico"];

export function MediaPanel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data: media = [] } = useMediaLibrary();
  const { data: matches = [] } = useMatches();

  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [matchId, setMatchId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!url) { toast.error("Sube primero el archivo"); return; }
    setBusy(true);
    const { error } = await supabase.from("media").insert({
      url,
      media_type: type,
      title: title.trim() || null,
      description: description.trim() || null,
      category: category || null,
      match_id: matchId || null,
      featured,
      uploaded_by: session?.user.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Agregado a la Vikingoteca");
    setUrl(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setMatchId("");
    setFeatured(false);
    qc.invalidateQueries({ queryKey: ["media"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Elemento eliminado");
    qc.invalidateQueries({ queryKey: ["media"] });
  }

  async function toggleFeatured(id: string, value: boolean) {
    const { error } = await supabase.from("media").update({ featured: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(value ? "Destacado en la portada" : "Quitado de la portada");
    qc.invalidateQueries({ queryKey: ["media"] });
  }

  return (
    <PanelCard title="Vikingoteca">
      <MediaPicker
        folder="vikingoteca"
        label="Foto o video"
        accept="image/*,video/*"
        value={url}
        onChange={(path, t) => {
          setUrl(path);
          if (t) setType(t);
        }}
      />
      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Descripción">
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categoría">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Elegir" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Partido relacionado">
          <Select value={matchId} onValueChange={setMatchId}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {matches.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  vs {m.opponent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
        <span className="text-sm font-semibold">Destacar en la portada</span>
        <Switch checked={featured} onCheckedChange={setFeatured} />
      </div>
      <Button className="w-full" onClick={save} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Agregar a la Vikingoteca
      </Button>

      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {media.map((m) => (
            <div key={m.id} className="relative overflow-hidden rounded-lg border border-border">
              <StorageMedia
                path={m.url}
                type={m.media_type}
                alt={m.title ?? "Multimedia"}
                className="aspect-square w-full"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-1 top-1 h-7 w-7"
                aria-label={m.featured ? "Quitar de la portada" : "Destacar en la portada"}
                onClick={() => toggleFeatured(m.id, !m.featured)}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    m.featured ? "fill-accent text-accent" : "text-muted-foreground",
                  )}
                />
              </Button>
              <ConfirmButton
                title="¿Eliminar este contenido?"
                description="Se quitará de la Vikingoteca y de la portada."
                onConfirm={() => remove(m.id)}
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-1 top-1 h-7 w-7"
                  aria-label="Eliminar contenido"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </ConfirmButton>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}
