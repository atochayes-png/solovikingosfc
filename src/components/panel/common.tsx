import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DisplayModeSelector,
  StorageMedia,
  type DisplayMode,
} from "@/components/vk/media";
import { uploadFile } from "@/lib/storage";

/** Botón destructivo con confirmación y estado de carga. */
export function ConfirmButton({
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Eliminar",
  className,
}: {
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Sube una imagen o video al bucket privado y devuelve la ruta. */
export function MediaPicker({
  folder,
  value,
  onChange,
  label = "Archivo",
  accept = "image/*",
  displayMode = "auto",
  onDisplayModeChange,
  recommendedVertical = false,
}: {
  folder: string;
  value: string | null;
  onChange: (path: string | null, type?: "image" | "video") => void;
  label?: string;
  accept?: string;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  recommendedVertical?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file?: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const { path, type } = await uploadFile(file, folder);
      onChange(path, type);
      toast.success("Archivo subido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <Field label={label}>
      {value && (
        <StorageMedia
          path={value}
          type={value.match(/\.(mp4|mov|webm)$/i) ? "video" : "image"}
          alt="Vista previa"
          displayMode={displayMode}
          className="mb-3 max-h-72 rounded-lg"
        />
      )}
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:items-center sm:gap-3">
        <Button className="w-full sm:w-auto" type="button" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value ? "Reemplazar" : "Subir"}
        </Button>
        {value && (
          <Button className="w-full sm:w-auto" type="button" variant="ghost" onClick={() => onChange(null)}>
            Quitar
          </Button>
        )}
      </div>
      <Input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {onDisplayModeChange && (
        <DisplayModeSelector
          value={displayMode}
          onChange={onDisplayModeChange}
          recommended={recommendedVertical}
        />
      )}
    </Field>
  );
}

export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}
