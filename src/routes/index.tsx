import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarDays, MapPin, Trophy } from "lucide-react";

import { AppShell, Crest, EmptyState } from "@/components/vk/shell";
import { MediaGallery, StorageImage, StorageMedia } from "@/components/vk/media";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import {
  computeClubTotals,
  useMatches,
  usePlayers,
  useMediaLibrary,
  type Match,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vikingos FC — Club de la Liga de Veteranos en Mérida" },
      {
        name: "description",
        content:
          "Plataforma oficial de Vikingos FC: próximos partidos, resultados, plantilla, estadísticas, Vikingoteca y La Tribuna Vikinga. Fundado en 2017 en Mérida, Yucatán.",
      },
      { property: "og:title", content: "Vikingos FC — Plataforma oficial del club" },
      {
        property: "og:description",
        content:
          "Partidos, resultados, plantilla, estadísticas y la comunidad de Vikingos FC, Liga de Veteranos de la Escuela Modelo.",
      },
    ],
  }),
  component: Home,
});

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

function MatchdayHero({ match }: { match: Match }) {
  const cd = useCountdown(match.kickoff);
  return (
    <section className="relative overflow-hidden">
      <img
        src={BRAND.pitch}
        alt="Cancha de Vikingos FC en noche de partido"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.2_0.07_262/0.75),oklch(0.18_0.06_262/0.95))]" />
      <div className="relative px-5 py-12 text-center text-white sm:py-16">
        <p className="eyebrow inline-block rounded-full bg-white/15 px-3 py-1 text-white">
          Matchday
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-2">
            <Crest className="h-16 w-16 sm:h-24 sm:w-24" />
            <span className="font-display text-sm font-extrabold sm:text-lg">VIKINGOS FC</span>
          </div>
          <span className="font-display text-2xl font-black text-white/60 sm:text-4xl">VS</span>
          <div className="flex max-w-[9rem] flex-col items-center gap-2">
            {match.opponent_crest_url ? (
              <StorageImage
                path={match.opponent_crest_url}
                alt={`Escudo de ${match.opponent}`}
                className="h-16 w-16 rounded-full bg-white/10 object-contain sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-display text-2xl font-black sm:h-24 sm:w-24">
                {match.opponent.charAt(0)}
              </div>
            )}
            <span className="font-display text-sm font-extrabold sm:text-lg">{match.opponent}</span>
          </div>
        </div>

        <div className="mt-7 space-y-1 text-sm text-white/85">
          {match.kickoff && (
            <p className="font-semibold">
              {format(new Date(match.kickoff), "EEEE d 'de' MMMM · HH:mm 'h'", { locale: es })}
            </p>
          )}
          {match.venue && <p>{match.venue}</p>}
          {match.matchday && <p className="text-white/60">Jornada {match.matchday}</p>}
        </div>

        {cd && (
          <div className="mx-auto mt-7 flex max-w-xs justify-center gap-2">
            {[
              { v: cd.h, l: "hrs" },
              { v: cd.m, l: "min" },
              { v: cd.s, l: "seg" },
            ].map((x) => (
              <div key={x.l} className="flex-1 rounded-lg bg-white/10 py-3">
                <p className="font-display text-2xl font-black tabular-nums">
                  {String(x.v).padStart(2, "0")}
                </p>
                <p className="eyebrow text-[9px] text-white/60">{x.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DefaultHero() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={BRAND.team}
        alt="Plantel de Vikingos FC en la cancha"
        className="h-[62vh] max-h-[520px] w-full object-cover object-top sm:h-[70vh]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.2_0.07_262/0.55)_0%,transparent_35%,oklch(0.18_0.06_262/0.92)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-8 text-white sm:px-8 sm:pb-10">
        <Crest className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20" />
        <h1 className="mt-3 font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
          VIKINGOS FC
        </h1>
        <p className="eyebrow mt-3 text-white/70">Fundado {BRAND.founded}</p>
        <p className="mt-1 text-sm font-semibold text-white/90">{BRAND.league}</p>
        <p className="text-sm text-white/70">{BRAND.city}</p>
      </div>
    </section>
  );
}

function Home() {
  const { data: matches = [] } = useMatches();
  const { data: players = [] } = usePlayers();
  const { data: media = [] } = useMediaLibrary();

  const today = useMemo(
    () =>
      matches.find(
        (m) => m.status === "programado" && m.kickoff && isSameDay(new Date(m.kickoff), new Date()),
      ),
    [matches],
  );

  const next = useMemo(
    () =>
      matches
        .filter((m) => m.status === "programado" && m.kickoff && new Date(m.kickoff) > new Date())
        .sort((a, b) => new Date(a.kickoff!).getTime() - new Date(b.kickoff!).getTime())[0],
    [matches],
  );

  const last = useMemo(
    () =>
      matches
        .filter((m) => m.status === "finalizado" && m.goals_for !== null)
        .sort(
          (a, b) => new Date(b.kickoff ?? 0).getTime() - new Date(a.kickoff ?? 0).getTime(),
        )[0],
    [matches],
  );

  const totals = computeClubTotals(matches);
  const mvpPlayer = last?.mvp_player_id ? players.find((p) => p.id === last.mvp_player_id) : null;
  const featured = media.filter((m) => m.featured).slice(0, 4);

  const hasAnything = matches.length > 0 || players.length > 0;

  return (
    <AppShell>
      {today ? <MatchdayHero match={today} /> : <DefaultHero />}

      <div className="space-y-8 px-4 py-8 sm:px-6">
        {!hasAnything && (
          <EmptyState
            title="La plataforma está lista para su primera captura."
            hint="Cuando se registren jugadores y partidos, esta portada mostrará el próximo encuentro, el último resultado y el MVP."
            action={
              <Button asChild>
                <Link to="/acceso">Iniciar sesión</Link>
              </Button>
            }
          />
        )}

        {(next || last) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {next && (
              <article className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="eyebrow text-muted-foreground">Próximo partido</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold">
                  {next.is_home ? "Vikingos FC" : next.opponent} vs{" "}
                  {next.is_home ? next.opponent : "Vikingos FC"}
                </h2>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {next.kickoff && (
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-accent" />
                      {format(new Date(next.kickoff), "d MMM yyyy · HH:mm 'h'", { locale: es })}
                    </p>
                  )}
                  {next.venue && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      {next.venue}
                    </p>
                  )}
                </div>
                <Button asChild variant="link" className="mt-3 h-auto p-0">
                  <Link to="/partidos/$id" params={{ id: next.id }}>
                    Ver ficha <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </article>
            )}

            {last && (
              <article className="surface-navy rounded-xl p-5 shadow-lift">
                <p className="eyebrow text-white/60">Último resultado</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-extrabold">VIK</span>
                  <span className="font-display text-4xl font-black tabular-nums">
                    {last.goals_for} - {last.goals_against}
                  </span>
                  <span className="max-w-[7rem] truncate font-display text-lg font-extrabold">
                    {last.opponent}
                  </span>
                </div>
                <Button
                  asChild
                  variant="link"
                  className="mt-3 h-auto p-0 text-white hover:text-white/80"
                >
                  <Link to="/partidos/$id" params={{ id: last.id }}>
                    Crónica y detalles <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </article>
            )}
          </div>
        )}

        {totals.pj > 0 && (
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="eyebrow text-muted-foreground">Temporada en curso</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { l: "PJ", v: totals.pj },
                { l: "PG", v: totals.pg },
                { l: "DG", v: totals.dg > 0 ? `+${totals.dg}` : totals.dg },
                { l: "PTS", v: totals.pts },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-secondary py-3">
                  <p className="font-display text-2xl font-black tabular-nums">{s.v}</p>
                  <p className="eyebrow text-[9px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link to="/estadisticas">
                Todas las estadísticas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        {mvpPlayer && (
          <section className="overflow-hidden rounded-xl border border-accent/40 bg-card shadow-card">
            <div className="flex items-stretch">
              <StorageMedia
                path={mvpPlayer.photo_url}
                type="image"
                alt={mvpPlayer.full_name}
                displayMode={mvpPlayer.photo_display_mode}
                className="w-28 shrink-0"
              />
              <div className="flex flex-col justify-center p-4">
                <p className="eyebrow flex items-center gap-1.5 text-accent-foreground">
                  <Trophy className="h-3.5 w-3.5" /> MVP del último partido
                </p>
                <h3 className="mt-1 font-display text-xl font-extrabold">
                  {mvpPlayer.nickname || mvpPlayer.full_name}
                </h3>
                {last?.mvp_comment && (
                  <p className="mt-1 text-sm text-muted-foreground">{last.mvp_comment}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-xl font-extrabold">Destacado</h2>
              <Button asChild variant="link" className="h-auto p-0">
                <Link to="/vikingoteca">Vikingoteca</Link>
              </Button>
            </div>
            <MediaGallery
              className="mt-3 sm:columns-4"
              items={featured.map((m) => ({
                url: m.url,
                type: m.media_type,
                alt: m.title ?? "Fotografía del club",
                displayMode: m.display_mode,
              }))}
            />
          </section>
        )}

        <section className="surface-navy rounded-xl p-6 text-center">
          <h2 className="font-display text-2xl font-extrabold">La Tribuna Vikinga</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">
            La conversación del vestidor: fotos, retas, memes y La Vikingada de la Jornada.
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/tribuna">Entrar a La Tribuna</Link>
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
