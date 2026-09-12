import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMedia } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export type DisplayMode = "auto" | "vertical" | "horizontal";

export type MediaSource = {
  url: string;
  type?: string | null;
  alt: string;
  displayMode?: DisplayMode | null;
};

const modeFrame: Record<Exclude<DisplayMode, "auto">, string> = {
  vertical: "aspect-[4/5] w-full max-w-xl",
  horizontal: "aspect-video w-full",
};

export function StorageImage({
  path,
  alt,
  className,
  fallback,
}: {
  path?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  fallback?: React.ReactNode | undefined;
}) {
  const url = useMedia(path);
  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary", className)}>
        {fallback ?? <User className="h-1/3 w-1/3 text-muted-foreground/50" />}
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

export function StorageMedia({
  path,
  type,
  alt,
  className,
  contain,
  displayMode = "auto",
  controls = true,
}: {
  path?: string | null | undefined;
  type?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  contain?: boolean | undefined;
  displayMode?: DisplayMode | null | undefined;
  controls?: boolean;
}) {
  const url = useMedia(path);
  if (!url) {
    return (
      <div className={cn("grid min-h-32 place-items-center bg-secondary", className)}>
        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }
  const mode = displayMode ?? "auto";
  const framed = mode !== "auto";
  const frameClass = framed ? modeFrame[mode] : "w-full";

  const media = type === "video" ? (
    <video
      src={url}
      controls={controls}
      playsInline
      preload="metadata"
      className={cn(
        "block max-h-[78vh] w-full bg-secondary",
        framed ? "h-full object-contain" : "h-auto object-contain",
      )}
    />
  ) : (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn(
        "block max-h-[78vh] w-full bg-secondary",
        framed || contain ? "h-full object-contain" : "h-auto object-contain",
      )}
    />
  );

  return <div className={cn("mx-auto overflow-hidden", frameClass, className)}>{media}</div>;
}

export function DisplayModeSelector({
  value,
  onChange,
  recommended,
}: {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  recommended?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Formato de visualización
      </p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as DisplayMode)}
        variant="outline"
        className="grid grid-cols-3"
      >
        <ToggleGroupItem value="auto" className="h-auto min-h-10 px-2 text-xs">
          Automático
        </ToggleGroupItem>
        <ToggleGroupItem value="vertical" className="h-auto min-h-10 px-2 text-xs">
          Vertical 4:5
        </ToggleGroupItem>
        <ToggleGroupItem value="horizontal" className="h-auto min-h-10 px-2 text-xs">
          Horizontal 16:9
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        El archivo original se conservará sin recortes.
        {recommended ? " Recomendado: Vertical 4:5." : ""}
      </p>
    </div>
  );
}

export function LocalMediaPreview({
  file,
  displayMode,
  className,
}: {
  file: File;
  displayMode: DisplayMode;
  className?: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!url) return null;
  const mode = displayMode === "auto" ? "w-full" : modeFrame[displayMode];
  const content = file.type.startsWith("video/") ? (
    <video src={url} controls playsInline className="h-full max-h-[65vh] w-full object-contain" />
  ) : (
    <img src={url} alt={`Vista previa de ${file.name}`} className="h-full max-h-[65vh] w-full object-contain" />
  );
  return (
    <div className={cn("mx-auto overflow-hidden rounded-lg bg-secondary", mode, className)}>
      {content}
    </div>
  );
}

export function MediaGallery({
  items,
  className,
}: {
  items: MediaSource[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      <div className={cn(items.length === 1 ? "block" : "columns-2 gap-2 sm:columns-3", className)}>
        {items.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            aria-label={`Abrir ${item.alt}`}
            onClick={() => setOpenIndex(index)}
            className={cn("block w-full overflow-hidden rounded-lg", items.length > 1 && "mb-2 break-inside-avoid")}
          >
            <StorageMedia
              path={item.url}
              type={item.type}
              alt={item.alt}
              displayMode={item.displayMode}
              controls={false}
            />
          </button>
        ))}
      </div>
      <MediaLightbox items={items} index={openIndex} onIndexChange={setOpenIndex} />
    </>
  );
}

export function MediaLightbox({
  items,
  index,
  onIndexChange,
}: {
  items: MediaSource[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const current = index === null ? null : items[index];
  const move = (step: number) => {
    if (index === null) return;
    onIndexChange((index + step + items.length) % items.length);
  };
  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-6xl border-0 bg-background/95 p-2 sm:p-4">
        <DialogTitle className="sr-only">Visor multimedia</DialogTitle>
        {current && (
          <div className="relative flex min-h-52 items-center justify-center">
            <StorageMedia
              path={current.url}
              type={current.type}
              alt={current.alt}
              displayMode="auto"
              className="max-w-full"
            />
            {items.length > 1 && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label="Archivo anterior"
                  className="absolute left-2 top-1/2 shrink-0 -translate-y-1/2"
                  onClick={() => move(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label="Archivo siguiente"
                  className="absolute right-2 top-1/2 shrink-0 -translate-y-1/2"
                  onClick={() => move(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
