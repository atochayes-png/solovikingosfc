import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { Button } from "@/components/ui/button";
import { MediaGallery } from "@/components/vk/media";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "@/lib/queries";

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
          <MediaGallery
            items={items.map((m) => ({
              url: m.url,
              type: m.media_type,
              alt: m.title ?? "Multimedia del club",
              displayMode: m.display_mode,
            }))}
          />
        )}
      </div>
    </AppShell>
  );
}
