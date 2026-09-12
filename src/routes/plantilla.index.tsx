import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { StorageMedia } from "@/components/vk/media";
import { POSITIONS } from "@/lib/brand";
import { usePlayers } from "@/lib/queries";

export const Route = createFileRoute("/plantilla/")({
  head: () => ({
    meta: [
      { title: "Plantilla — Vikingos FC" },
      {
        name: "description",
        content:
          "Conoce a los jugadores de Vikingos FC: dorsal, posición y ficha individual de cada vikingo.",
      },
      { property: "og:title", content: "Plantilla — Vikingos FC" },
      { property: "og:description", content: "Jugadores registrados de Vikingos FC." },
    ],
  }),
  component: Plantilla,
});

function Plantilla() {
  const { data: players = [], isLoading } = usePlayers();
  const active = players.filter((p) => p.active);

  const groups = POSITIONS.map((pos) => ({
    pos,
    items: active.filter((p) => p.position === pos),
  })).filter((g) => g.items.length > 0);

  const unassigned = active.filter((p) => !p.position || !POSITIONS.includes(p.position as never));
  if (unassigned.length > 0) groups.push({ pos: "Sin posición", items: unassigned } as never);

  return (
    <AppShell>
      <PageHeader
        eyebrow="El plantel"
        title="Plantilla"
        description="Jugadores registrados oficialmente por el club."
      />
      <div className="space-y-8 px-4 pb-6 sm:px-6">
        {isLoading ? null : active.length === 0 ? (
          <EmptyState
            title="Aún no hay jugadores registrados."
            hint="El panel de administración permite dar de alta a cada vikingo."
          />
        ) : (
          groups.map((g) => (
            <section key={g.pos}>
              <h2 className="eyebrow text-muted-foreground">{g.pos}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {g.items.map((p) => (
                  <Link
                    key={p.id}
                    to="/plantilla/$id"
                    params={{ id: p.id }}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
                  >
                    <div className="relative">
                      <StorageMedia
                        path={p.photo_url}
                        type="image"
                        alt={p.full_name}
                        displayMode={p.photo_display_mode}
                        className="aspect-[4/5] w-full"
                      />
                      {p.jersey_number != null && (
                        <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 font-display text-sm font-black text-primary-foreground">
                          {p.jersey_number}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate font-display text-base font-extrabold leading-tight">
                        {p.nickname || p.full_name}
                      </p>
                      {p.nickname && (
                        <p className="truncate text-xs text-muted-foreground">{p.full_name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
