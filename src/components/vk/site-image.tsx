import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DisplayModeSelector, LocalMediaPreview, type DisplayMode } from "@/components/vk/media";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSiteImages, type SiteImageKey } from "@/lib/queries";
import { useMedia, uploadFile } from "@/lib/storage";
import { cn } from "@/lib/utils";

const FOLDER = "institucional";

const modeClass: Record<Exclude<DisplayMode, "auto">, string> = {
  vertical: "aspect-[4/5] object-contain",
  horizontal: "aspect-video object-contain",
};

/** Imagen institucional administrable: usa la imagen guardada o la original del proyecto. */
export function SiteImage({
  imageKey,
  fallbackSrc,
  alt,
  className,
}: {
  imageKey: SiteImageKey;
  fallbackSrc: string;
  alt: string;
  className?: string;
}) {
  const { data: images } = useSiteImages();
  const record = images?.[imageKey] ?? null;
  const stored = useMedia(record?.path ?? null);
  const src = record?.path ? stored : fallbackSrc;
  const mode = record?.display_mode ?? "auto";

  if (!src) return <div className={cn("bg-secondary", className)} aria-hidden />;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(className, mode !== "auto" && modeClass[mode])}
    />
  );
}

/** Envoltura con la acción discreta "Cambiar imagen" visible solo para Master y Administrador. */
export function ManagedSiteImage({
  imageKey,
  title,
  recommendedVertical,
  children,
  actionClassName,
}: {
  imageKey: SiteImageKey;
  title: string;
  recommendedVertical?: boolean;
  children: ReactNode;
  actionClassName?: string;
}) {
  const { isStaff } = useAuth();
  return (
    <div className="relative">
      {children}
      {isStaff && (
        <SiteImageEditor
          imageKey={imageKey}
          title={title}
          recommendedVertical={recommendedVertical ?? false}
          className={cn("absolute right-3 top-3 z-10 shadow-lift", actionClassName)}
        />
      )}
    </div>
  );
}

export function SiteImageEditor({
  imageKey,
  title,
  recommendedVertical = false,
  className,
  variant = "secondary",
  label = "Cambiar imagen",
}: {
  imageKey: SiteImageKey;
  title: string;
  recommendedVertical?: boolean;
  className?: string;
  variant?: "secondary" | "outline";
  label?: string;
}) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data: images } = useSiteImages();
  const record = images?.[imageKey] ?? null;

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<DisplayMode>(record?.display_mode ?? "auto");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setMode(record?.display_mode ?? "auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Borra el archivo anterior solo si ninguna otra referencia lo utiliza. */
  async function cleanupPrevious(previous: string | null | undefined) {
    if (!previous || !previous.startsWith(`${FOLDER}/`)) return;
    const [{ data: others }, { data: inMedia }] = await Promise.all([
      supabase.from("site_images").select("key").eq("path", previous),
      supabase.from("media").select("id").eq("url", previous).limit(1),
    ]);
    if ((others ?? []).length > 0 || (inMedia ?? []).length > 0) return;
    await supabase.storage.from("vikingos").remove([previous]);
  }

  async function save() {
    if (!file && !record) {
      toast.error("Elige primero una imagen");
      return;
    }
    setBusy(true);
    try {
      let path = record?.path ?? null;
      if (file) {
        const uploaded = await uploadFile(file, `${FOLDER}/${imageKey}`);
        path = uploaded.path;
      }
      if (!path) throw new Error("No se pudo preparar la imagen");

      const { error } = await supabase.from("site_images").upsert(
        {
          key: imageKey,
          path,
          display_mode: mode,
          updated_by: session?.user.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
      if (error) throw new Error(error.message);

      if (file && record?.path && record.path !== path) await cleanupPrevious(record.path);

      await qc.invalidateQueries({ queryKey: ["site_images"] });
      toast.success("Imagen actualizada correctamente");
      setOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo guardar la imagen. Se conserva la anterior.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      const previous = record?.path ?? null;
      const { error } = await supabase.from("site_images").delete().eq("key", imageKey);
      if (error) throw new Error(error.message);
      await cleanupPrevious(previous);
      await qc.invalidateQueries({ queryKey: ["site_images"] });
      toast.success("Se restableció la imagen original");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo restablecer la imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              El archivo original se conserva tal cual. Solo se guarda tu preferencia de
              presentación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {file ? (
              <LocalMediaPreview file={file} displayMode={mode} />
            ) : record?.path ? (
              <StoredSitePreview path={record.path} mode={mode} />
            ) : (
              <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                Ahora se muestra la imagen original del proyecto. Sube una nueva para reemplazarla.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {file || record ? "Elegir otra imagen" : "Elegir imagen"}
              </Button>
              {record && (
                <Button type="button" variant="ghost" disabled={busy} onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restablecer original
                </Button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (next) setFile(next);
                e.target.value = "";
              }}
            />

            <DisplayModeSelector
              value={mode}
              onChange={setMode}
              recommended={recommendedVertical}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1" disabled={busy} onClick={save}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar imagen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StoredSitePreview({ path, mode }: { path: string; mode: DisplayMode }) {
  const url = useMedia(path);
  if (!url) return <div className="h-48 animate-pulse rounded-lg bg-secondary" />;
  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-lg bg-secondary",
        mode === "vertical" ? "aspect-[4/5] max-w-xs" : mode === "horizontal" ? "aspect-video" : "",
      )}
    >
      <img src={url} alt="Vista previa" className="h-full max-h-72 w-full object-contain" />
    </div>
  );
}
