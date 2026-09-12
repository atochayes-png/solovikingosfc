import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Trophy, Laugh } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { MediaGallery, StorageMedia } from "@/components/vk/media";
import { Badge } from "@/components/ui/badge";
import { useMatch, useMatchEvents, useMediaLibrary, usePlayers } from "@/lib/queries";

export const Route = createFileRoute("/partidos/$id")({
  head: () => ({
    meta: [
      { title: "Ficha del partido — Vikingos FC" },
      {
        name: "description",
        content:
          "Marcador, goleadores, tarjetas, MVP, La Vikingada de la Jornada y crónica del encuentro.",
      },
      { property: "og:title", content: "Ficha del partido — Vikingos FC" },
      {
        property: "og:description",
        content: "Detalle completo del encuentro de Vikingos FC.",
      },
    ],
  }),
  component: FichaPartido,
});

const EVENT_LABEL: Record<string, string> = {
  gol: "Goles",
  asistencia: "Asistencias",
  amarilla: "Tarjetas amarillas",
  roja: "Tarjetas rojas",
};

function FichaPartido() {
  const { id } = Route.useParams();
  const { data: match, isLoading } = useMatch(id);
  const { data: events = [] } = useMatchEvents(id);
  const { data: players = [] } = usePlayers();
  const { data: media = [] } = useMediaLibrary();

  const name = (pid: string | null) => {
    const p = players.find((x) => x.id === pid);
    return p ? p.nickname || p.full_name : "—";
  };

  if (isLoading) return <AppShell>{null}</AppShell>;
  if (!match)
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState title="Este partido no está disponible." />
        </div>
      </AppShell>
    );

  const finished = match.status === "finalizado" && match.goals_for !== null;
  const mvp = players.find((p) => p.id === match.mvp_player_id);
  const vikingadaPlayer = players.find((p) => p.id === match.vikingada_player_id);
  const gallery = media.filter((m) => m.match_id === match.id);
  const grouped = (["gol", "asistencia", "amarilla", "roja"] as const)
    .map((t) => ({ type: t, items: events.filter((e) => e.event_type === t) }))
    .filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <section className="surface-navy px-5 py-8 text-center sm:px-8">
        <p className="eyebrow text-white/55">
          {match.matchday ? `Jornada ${match.matchday}` : "Encuentro"} ·{" "}
          {match.is_home ? "Local" : "Visitante"}
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="font-display text-xl font-black">VIKINGOS</span>
          {finished ? (
            <span className="font-display text-5xl font-black tabular-nums">
              {match.goals_for}-{match.goals_against}
            </span>
          ) : (
            <span className="font-display text-2xl font-black text-white/50">VS</span>
          )}
          <span className="max-w-[8rem] truncate font-display text-xl font-black">
            {match.opponent}
          </span>
        </div>
        <div className="mt-4 space-y-1 text-sm text-white/75">
          {match.kickoff && (
            <p className="flex items-center justify-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(match.kickoff), "EEEE d 'de' MMMM yyyy · HH:mm 'h'", { locale: es })}
            </p>
          )}
          {match.venue && (
            <p className="flex items-center justify-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </p>
          )}
        </div>
        {match.status !== "programado" && match.status !== "finalizado" && (
          <Badge variant="secondary" className="mt-3 capitalize">
            {match.status}
          </Badge>
        )}
      </section>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {match.preview && !finished && (
          <article className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="eyebrow text-muted-foreground">Previa</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{match.preview}</p>
          </article>
        )}

        {grouped.length > 0 && (
          <section className="grid gap-3 sm:grid-cols-2">
            {grouped.map((g) => (
              <article key={g.type} className="rounded-xl border border-border bg-card p-4">
                <p className="eyebrow text-muted-foreground">{EVENT_LABEL[g.type]}</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {g.items.map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{name(e.player_id)}</span>
                      {e.minute != null && (
                        <span className="text-xs text-muted-foreground">{e.minute}'</span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        )}

        {mvp && (
          <section className="overflow-hidden rounded-xl border border-accent/50 bg-card shadow-card">
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-stretch">
              <StorageMedia
                path={mvp.photo_url}
                type="image"
                alt={mvp.full_name}
                displayMode={mvp.photo_display_mode}
                className="w-28 shrink-0"
              />
              <div className="flex flex-col justify-center p-4">
                <p className="eyebrow flex items-center gap-1.5 text-accent-foreground">
                  <Trophy className="h-3.5 w-3.5" /> MVP del partido
                </p>
                <Link
                  to="/plantilla/$id"
                  params={{ id: mvp.id }}
                  className="mt-1 font-display text-xl font-extrabold hover:underline"
                >
                  {mvp.nickname || mvp.full_name}
                </Link>
                {match.mvp_comment && (
                  <p className="mt-1 text-sm text-muted-foreground">{match.mvp_comment}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {(match.vikingada_title || match.vikingada_description) && (
          <section className="overflow-hidden rounded-xl border-2 border-dashed border-accent bg-accent/10 p-5">
            <p className="eyebrow flex items-center gap-1.5 text-accent-foreground">
              <Laugh className="h-4 w-4" /> La Vikingada de la Jornada
            </p>
            {match.vikingada_title && (
              <h3 className="mt-2 font-display text-2xl font-black">{match.vikingada_title}</h3>
            )}
            {vikingadaPlayer && (
              <p className="mt-1 text-sm font-semibold text-accent-foreground">
                Protagonista: {vikingadaPlayer.nickname || vikingadaPlayer.full_name}
              </p>
            )}
            {match.vikingada_description && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {match.vikingada_description}
              </p>
            )}
            {match.vikingada_media_url && (
              <StorageMedia
                path={match.vikingada_media_url}
                type={match.vikingada_media_url.match(/\.(mp4|mov|webm)$/i) ? "video" : "image"}
                alt="Momento de La Vikingada de la Jornada"
                displayMode={match.vikingada_display_mode}
                className="mt-4 w-full rounded-lg"
              />
            )}
          </section>
        )}

        {match.chronicle && (
          <article className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="eyebrow text-muted-foreground">Crónica</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{match.chronicle}</p>
          </article>
        )}

        {gallery.length > 0 && (
          <section>
            <p className="eyebrow text-muted-foreground">Galería del partido</p>
            <MediaGallery
              className="mt-3"
              items={gallery.map((m) => ({
                url: m.url,
                type: m.media_type,
                alt: m.title ?? "Fotografía del partido",
                displayMode: m.display_mode,
              }))}
            />
          </section>
        )}
      </div>
    </AppShell>
  );
}
