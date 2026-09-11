import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { StorageMedia } from "@/components/vk/media";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMediaLibrary, type MediaItem } from "@/lib/queries";

export const Route = createFileRoute("/vikingoteca")({
  head: () => ({
    meta: [
      { title: "Vikingoteca — Galería de Vikingos FC" },
      {
        name: "description",
        content:
          "Archivo multimedia de Vikingos FC: fotos y videos de partidos, entrenamientos, celebraciones y torneos.",
      },
      { property: "og:title", content: "Vikingoteca — Galería de Vikingos FC" },
      { property: "og:description", content: "Fotos y videos históricos del club." },
    ],
  }),
  component: Vikingoteca,
});

function Vikingoteca() {
  const { data: media = [], isLoading } = useMediaLibrary();
  const [filter, setFilter] = useState<string>("todo");
  const [open, setOpen] = useState<MediaItem | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(media.map((m) => m.category).filter(Boolean))) as string[],
    [media],
  );
  const items = filter === "todo" ? media : media.filter((m) => m.category === filter);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Archivo del club"
        title="Vikingoteca"
        description="La memoria visual de Vikingos FC."
      />

      <div className="px-4 pb-6 sm:px-6">
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {["todo", ...categories].map((c) => (
              <Button
                key={c}
                size="sm"
                variant={filter === c ? "default" : "outline"}
                onClick={() => setFilter(c)}
                className={cn("capitalize")}
              >
                {c}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? null : items.length === 0 ? (
          <EmptyState
            title="La Vikingoteca todavía está vacía."
            hint="Las fotos y videos que suba el club aparecerán aquí."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpen(m)}
                className="overflow-hidden rounded-lg border border-border bg-card text-left"
              >
                <StorageMedia
                  path={m.url}
                  type={m.media_type}
                  alt={m.title ?? "Multimedia del club"}
                  className="aspect-square w-full"
                />
                {m.title && (
                  <p className="truncate px-2 py-1.5 text-xs font-semibold">{m.title}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="font-display text-lg font-extrabold">
            {open?.title ?? "Vikingoteca"}
          </DialogTitle>
          {open && (
            <StorageMedia
              path={open.url}
              type={open.media_type}
              alt={open.title ?? "Multimedia del club"}
              className="max-h-[70vh] w-full rounded-lg"
              contain
            />
          )}
          {open?.description && (
            <p className="text-sm text-muted-foreground">{open.description}</p>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
