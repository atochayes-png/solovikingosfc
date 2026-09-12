import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmButton, Field, MediaPicker, PanelCard } from "@/components/panel/common";
import { EmptyState } from "@/components/vk/shell";
import { StorageImage } from "@/components/vk/media";
import { supabase } from "@/integrations/supabase/client";
import { useSponsors, type Sponsor } from "@/lib/queries";

type Draft = {
  id?: string;
  name: string;
  logo_url: string | null;
  destination_url: string;
  is_active: boolean;
  display_order: number;
};

const emptyDraft = (order: number): Draft => ({
  name: "",
  logo_url: null,
  destination_url: "",
  is_active: true,
  display_order: order,
});

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function SponsorsPanel() {
  const qc = useQueryClient();
  const { data: sponsors = [], isLoading } = useSponsors();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["sponsors"] });

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error("Escribe el nombre del patrocinador");
    if (!draft.logo_url) return toast.error("Sube el logotipo");
    if (!isValidUrl(draft.destination_url.trim()))
      return toast.error("El enlace debe ser una URL válida (https://...)");

    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        logo_url: draft.logo_url,
        destination_url: draft.destination_url.trim(),
        is_active: draft.is_active,
        display_order: Number(draft.display_order) || 1,
      };
      const { error } = draft.id
        ? await supabase.from("sponsors").update(payload).eq("id", draft.id)
        : await supabase.from("sponsors").insert(payload);
      if (error) throw error;
      toast.success(draft.id ? "Patrocinador actualizado" : "Patrocinador agregado");
      setDraft(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(sponsor: Sponsor) {
    const { error } = await supabase
      .from("sponsors")
      .update({ is_active: !sponsor.is_active })
      .eq("id", sponsor.id);
    if (error) return toast.error(error.message);
    toast.success(sponsor.is_active ? "Patrocinador desactivado" : "Patrocinador activado");
    await refresh();
  }

  async function remove(sponsor: Sponsor) {
    const { error } = await supabase.from("sponsors").delete().eq("id", sponsor.id);
    if (error) return toast.error(error.message);
    await supabase.storage.from("vikingos").remove([sponsor.logo_url]);
    toast.success("Patrocinador eliminado");
    await refresh();
  }

  return (
    <div className="space-y-4">
      {draft ? (
        <PanelCard title={draft.id ? "Editar patrocinador" : "Nuevo patrocinador"}>
          <Field label="Nombre">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nombre interno del patrocinador"
            />
          </Field>

          <MediaPicker
            folder="patrocinadores"
            label="Logotipo"
            value={draft.logo_url}
            onChange={(path) => setDraft({ ...draft, logo_url: path })}
          />

          <Field label="Enlace" hint="Sitio web, Facebook, Instagram, WhatsApp o Google Maps.">
            <Input
              value={draft.destination_url}
              onChange={(e) => setDraft({ ...draft, destination_url: e.target.value })}
              placeholder="https://..."
              inputMode="url"
            />
          </Field>

          <Field label="Orden de aparición">
            <Input
              type="number"
              min={1}
              value={draft.display_order}
              onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })}
            />
          </Field>

          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
              aria-label="Estado del patrocinador"
            />
            <span className="text-sm">{draft.is_active ? "Activo" : "Inactivo"}</span>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
            </Button>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </PanelCard>
      ) : (
        <Button onClick={() => setDraft(emptyDraft(sponsors.length + 1))}>
          <Plus className="mr-2 h-4 w-4" /> Agregar patrocinador
        </Button>
      )}

      {isLoading ? null : sponsors.length === 0 ? (
        <EmptyState title="Aún no hay patrocinadores registrados." />
      ) : (
        <div className="space-y-2">
          {sponsors.map((s) => (
            <article
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <StorageImage
                path={s.logo_url}
                alt={s.name}
                className="h-14 w-14 shrink-0 rounded-lg bg-secondary object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">{s.destination_url}</p>
                <p className="text-xs text-muted-foreground">
                  Orden {s.display_order} · {s.is_active ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Switch
                  checked={s.is_active}
                  onCheckedChange={() => toggle(s)}
                  aria-label={`Activar ${s.name}`}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Editar ${s.name}`}
                  onClick={() =>
                    setDraft({
                      id: s.id,
                      name: s.name,
                      logo_url: s.logo_url,
                      destination_url: s.destination_url,
                      is_active: s.is_active,
                      display_order: s.display_order,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <ConfirmButton
                  title="¿Eliminar patrocinador?"
                  description="Se quitará de Inicio y se borrará su logotipo."
                  onConfirm={() => remove(s)}
                >
                  <Button size="icon" variant="ghost" aria-label={`Eliminar ${s.name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ConfirmButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
