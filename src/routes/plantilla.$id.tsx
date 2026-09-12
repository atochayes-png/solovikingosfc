import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { AppShell, EmptyState } from "@/components/vk/shell";
import { StorageMedia } from "@/components/vk/media";
import {
  computePlayerTotals,
  emptyTotals,
  useLineups,
  useMatchEvents,
  useMatches,
  usePlayers,
} from "@/lib/queries";

export const Route = createFileRoute("/plantilla/$id")({
  head: () => ({
    meta: [
      { title: "Ficha del jugador — Vikingos FC" },
      {
        name: "description",
        content:
          "Ficha individual con dorsal, posición y estadísticas acumuladas del jugador de Vikingos FC.",
      },
      { property: "og:title", content: "Ficha del jugador — Vikingos FC" },
      { property: "og:description", content: "Estadísticas del jugador en Vikingos FC." },
    ],
  }),
  component: FichaJugador,
});

function FichaJugador() {
  const { id } = Route.useParams();
  const { data: players = [], isLoading } = usePlayers();
  const { data: matches = [] } = useMatches();
  const { data: events = [] } = useMatchEvents();
  const { data: lineups = [] } = useLineups();

  const player = players.find((p) => p.id === id);
  const totals = computePlayerTotals(matches, events, lineups).get(id) ?? emptyTotals();

  if (isLoading) return <AppShell>{null}</AppShell>;
  if (!player)
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState title="Este jugador no está disponible." />
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="relative bg-secondary">
        <StorageMedia
          path={player.photo_url}
          type="image"
          alt={player.full_name}
          displayMode={player.photo_display_mode}
          className="max-h-[70vh] w-full rounded-none"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,oklch(0.18_0.06_262/0.92)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pb-5 text-white">
          <div className="min-w-0">
            {player.position && <p className="eyebrow text-white/60">{player.position}</p>}
            <h1 className="font-display text-3xl font-black leading-tight">
              {player.nickname || player.full_name}
            </h1>
            {player.nickname && <p className="text-sm text-white/70">{player.full_name}</p>}
          </div>
          {player.jersey_number != null && (
            <span className="font-display text-6xl font-black leading-none text-white/85">
              {player.jersey_number}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <section>
          <p className="eyebrow text-muted-foreground">Estadísticas acumuladas</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { l: "PJ", v: totals.pj },
              { l: "Goles", v: totals.goles },
              { l: "Asist.", v: totals.asistencias },
              { l: "Amar.", v: totals.amarillas },
              { l: "Rojas", v: totals.rojas },
              { l: "MVP", v: totals.mvp },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-lg border border-border bg-card py-3 text-center shadow-card"
              >
                <p className="font-display text-2xl font-black tabular-nums">{s.v}</p>
                <p className="eyebrow text-[9px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {player.joined_on && (
          <p className="text-sm text-muted-foreground">
            En el club desde {format(new Date(player.joined_on), "MMMM yyyy", { locale: es })}.
          </p>
        )}

        {player.bio && (
          <article className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="eyebrow text-muted-foreground">Semblanza</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{player.bio}</p>
          </article>
        )}
      </div>
    </AppShell>
  );
}
