import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trophy,
  Calendar,
  Users,
  ArrowRight,
  Shield,
  Activity,
  MapPin,
  Flame,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Medal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMatches, type Match } from "@/lib/queries";
import { useStandings } from "@/lib/standings";
import { BRAND } from "@/lib/brand";
import { Crest } from "@/components/vk/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATOSPORT — Portal Oficial de Gestión Deportiva y Torneos" },
      {
        name: "description",
        content:
          "Plataforma central de torneos deportivos, estadísticas en vivo, clasificaciones y comunidades deportivas. Hogar de la Liga Modelo de Veteranos y Vikingos FC.",
      },
      { property: "og:title", content: "ATOSPORT — Motor de Torneos y Comunidades Deportivas" },
      {
        property: "og:description",
        content: "Marcadores en tiempo real, tablas de posiciones y redes sociales de clubes en Mérida, Yucatán.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: AtosportPortal,
});

function AtosportPortal() {
  const [activeTab, setActiveTab] = useState<"tabla" | "rol" | "goleo">("tabla");
  const { data: matches = [] } = useMatches();
  const { data: standingsData } = useStandings();
  const standings = standingsData?.teams ?? [];

  // Próximo partido y último resultado
  const nextMatch = useMemo(
    () =>
      matches
        .filter((m) => m.status === "programado" && m.kickoff && new Date(m.kickoff) > new Date())
        .sort((a, b) => new Date(a.kickoff!).getTime() - new Date(b.kickoff!).getTime())[0],
    [matches],
  );

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#E2E8F0] selection:bg-emerald-500 selection:text-black">
      {/* 1. NAVBAR INSTITUCIONAL ATOSPORT */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-transform group-hover:scale-105">
              <span className="font-display text-xl font-black text-black">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-black tracking-wider text-white">
                ATO<span className="text-emerald-400">SPORT</span>
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-emerald-400/80 uppercase">
                Sports Engine
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#torneo-destacado"
              className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-emerald-400 transition-colors"
            >
              Torneos
            </a>
            <a
              href="#match-center"
              className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-emerald-400 transition-colors"
            >
              Match Center
            </a>
            <a
              href="#comunidades"
              className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-emerald-400 transition-colors"
            >
              Comunidades
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all"
            >
              <Link to="/acceso">
                Mi Torneo / Entrar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. TICKER DE JORNADA / MATCH CENTER */}
      <section id="match-center" className="border-b border-white/5 bg-[#090D14] py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                Match Center · Jornada en Curso
              </span>
            </div>
            <span className="text-[10px] text-white/40">Liga Modelo de Veteranos</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {matches.length === 0 ? (
              <div className="rounded-lg border border-white/5 bg-[#0F141F] px-4 py-2 text-xs text-white/50">
                Próximos encuentros por disputarse esta semana.
              </div>
            ) : (
              matches.slice(0, 6).map((m) => {
                const isLive = m.status === "programado" && m.kickoff && Math.abs(new Date(m.kickoff).getTime() - Date.now()) < 7200000;
                const isFinished = m.status === "finalizado";

                return (
                  <div
                    key={m.id}
                    className="flex min-w-[230px] shrink-0 flex-col justify-between rounded-xl border border-white/5 bg-[#0E131E] p-3 transition-colors hover:border-emerald-500/30"
                  >
                    <div className="mb-2 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-white/40">
                        {m.matchday ? `Jornada ${m.matchday}` : "Liga Regular"}
                      </span>
                      {isLive ? (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-400">
                          EN VIVO
                        </span>
                      ) : isFinished ? (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white/60">
                          FINAL
                        </span>
                      ) : (
                        <span className="text-white/40">
                          {m.kickoff ? format(new Date(m.kickoff), "EEE d · HH:mm", { locale: es }) : "Por definir"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs font-semibold">
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2 text-white">
                          {m.is_home ? "Vikingos FC" : m.opponent}
                        </span>
                        <span className="font-display font-black text-white">
                          {isFinished ? (m.is_home ? m.goals_for : m.goals_against) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2 text-white/80">
                          {m.is_home ? m.opponent : "Vikingos FC"}
                        </span>
                        <span className="font-display font-black text-white/80">
                          {isFinished ? (m.is_home ? m.goals_against : m.goals_for) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 3. HERO & TORNEO DESTACADO */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section id="torneo-destacado" className="space-y-6">
          {/* Header del Torneo */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0F172A] via-[#0E1524] to-[#0A101D] p-6 shadow-2xl sm:p-8">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    <Activity className="h-3 w-3" /> Torneo Oficial Activo
                  </span>
                  <span className="text-xs text-white/50">Fútbol 11 · Veteranos</span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
                  LIGA MODELO DE VETERANOS
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/60">
                  Competición oficial de la Escuela Modelo. Seguimiento digital de jornadas, tabla general, goleo y estadísticas con la tecnología de ATOSPORT.
                </p>
              </div>

              {nextMatch && (
                <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-sm sm:min-w-[260px]">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                    Próximo Partido Clave
                  </span>
                  <p className="mt-1 font-display text-base font-extrabold text-white">
                    {nextMatch.is_home ? "Vikingos FC" : nextMatch.opponent} vs{" "}
                    {nextMatch.is_home ? nextMatch.opponent : "Vikingos FC"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {nextMatch.venue || "Cancha Escuela Modelo"}
                  </p>
                </div>
              )}
            </div>

            {/* Pestañas de Navegación del Torneo */}
            <div className="mt-8 flex gap-2 border-b border-white/10 pb-px">
              <button
                type="button"
                onClick={() => setActiveTab("tabla")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "tabla"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Trophy className="h-4 w-4" /> Tabla de Posiciones
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rol")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "rol"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Calendar className="h-4 w-4" /> Rol de Juegos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("goleo")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "goleo"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Flame className="h-4 w-4" /> Goleo Individual
              </button>
            </div>
          </div>

          {/* Contenido de las Pestañas */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {activeTab === "tabla" && (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C111C] shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#0E1524] px-5 py-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                      Clasificación General
                    </span>
                    <span className="text-[11px] text-white/40">3 Puntos por victoria</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-white/40">
                          <th className="py-2.5 pl-4 pr-2 font-semibold">#</th>
                          <th className="py-2.5 px-3 font-semibold">Club</th>
                          <th className="py-2.5 px-2 text-center font-semibold">PJ</th>
                          <th className="py-2.5 px-2 text-center font-semibold">G</th>
                          <th className="py-2.5 px-2 text-center font-semibold">E</th>
                          <th className="py-2.5 px-2 text-center font-semibold">P</th>
                          <th className="py-2.5 px-2 text-center font-semibold">DIF</th>
                          <th className="py-2.5 pr-4 text-center font-bold text-white">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {standings.length > 0 ? (
                          standings.map((t, idx) => {
                            const isVikingos = t.is_vikingos;
                            const diff = t.gf - t.gc;
                            return (
                              <tr
                                key={t.id}
                                className={`transition-colors ${
                                  isVikingos
                                    ? "bg-emerald-950/30 text-white font-bold"
                                    : "hover:bg-white/[0.02] text-white/80"
                                }`}
                              >
                                <td className="py-3 pl-4 pr-2 font-mono">
                                  <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] ${
                                      idx < 4
                                        ? "bg-emerald-500/20 text-emerald-400 font-bold"
                                        : "text-white/40"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">
                                      {t.name}
                                    </span>
                                    {isVikingos && (
                                      <span className="rounded bg-emerald-500 px-1.5 py-0.2 text-[9px] font-black text-black">
                                        COMUNIDAD ACTIVA
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center font-mono text-white/60">{t.pj}</td>
                                <td className="py-3 px-2 text-center font-mono text-white/60">{t.g}</td>
                                <td className="py-3 px-2 text-center font-mono text-white/60">{t.e}</td>
                                <td className="py-3 px-2 text-center font-mono text-white/60">{t.p}</td>
                                <td className="py-3 px-2 text-center font-mono text-white/60">
                                  {diff > 0 ? `+${diff}` : diff}
                                </td>
                                <td className="py-3 pr-4 text-center font-mono font-black text-emerald-400">
                                  {t.pts}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-white/40">
                              Cargando clasificación oficial...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "rol" && (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0C111C] p-4 transition-colors hover:border-emerald-500/30"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          {m.kickoff ? format(new Date(m.kickoff), "EEEE d 'de' MMMM · HH:mm 'h'", { locale: es }) : "Fecha por confirmar"}
                        </div>
                        <div className="font-display text-base font-extrabold text-white">
                          {m.is_home ? "Vikingos FC" : m.opponent} vs {m.is_home ? m.opponent : "Vikingos FC"}
                        </div>
                        <div className="text-xs text-white/50">{m.venue || "Sede por confirmar"}</div>
                      </div>
                      <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                        {m.status === "finalizado" ? `${m.goals_for} - ${m.goals_against}` : "Programado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "goleo" && (
                <div className="rounded-2xl border border-white/10 bg-[#0C111C] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Goleadores del Torneo
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Temporada 2026</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { rank: 1, name: "Goleador Destacado", team: "Vikingos FC", goals: 8 },
                      { rank: 2, name: "Artillero Liga", team: "Club Rivales", goals: 7 },
                      { rank: 3, name: "Segundo Goleador", team: "Vikingos FC", goals: 5 },
                    ].map((g) => (
                      <div key={g.rank} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400">
                            {g.rank}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{g.name}</p>
                            <p className="text-[11px] text-white/50">{g.team}</p>
                          </div>
                        </div>
                        <span className="font-display text-base font-black text-white">{g.goals} Goles</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar informativo */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E1524] to-[#0A0E18] p-5 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Medal className="h-4 w-4" /> Acerca del Torneo
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-white">
                  Sistema de Competencia
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/60">
                  Fase regular con enfrentamientos directos a una sola vuelta. Los mejores 4 clasificados avanzan a la Fiesta Grande (Semifinales y Gran Final).
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-white/70">
                    <span>Sede Central:</span>
                    <span className="font-semibold text-white">Escuela Modelo</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Equipos participantes:</span>
                    <span className="font-semibold text-white">{standings.length || 10} Clubes</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                  Digitalización Deportiva
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-white">
                  ¿Administras una liga o torneo?
                </h3>
                <p className="mt-1.5 text-xs text-white/60">
                  Publica roles, actualiza tablas en tiempo real y gestiona cédulas arbitrales con ATOSPORT.
                </p>
                <Button asChild size="sm" className="mt-3 w-full bg-emerald-500 text-black hover:bg-emerald-400 font-bold">
                  <Link to="/acceso">Comenzar Ahora</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECCIÓN EXPLORAR COMUNIDADES / CLUBES */}
        <section id="comunidades" className="mt-16 space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Red de Comunidades Deportivas
              </p>
              <h2 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">
                Clubes Registrados
              </h2>
            </div>
            <p className="text-xs text-white/50 max-w-sm">
              Cada equipo cuenta con su propio portal: vestidor social, plantilla interactiva, crónicas y galerías.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* TARJETA DESTACADA: VIKINGOS FC */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0F1B2C] to-[#0A111C] p-6 shadow-2xl transition-all hover:border-emerald-400">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Crest className="h-12 w-12 drop-shadow-md" />
                  <div>
                    <h3 className="font-display text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                      VIKINGOS FC
                    </h3>
                    <p className="text-xs text-white/60">Liga de Veteranos · Fundado {BRAND.founded}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Comunidad Activa
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-white/70">
                Portal oficial con estadísticas individuales de la plantilla, Vikingoteca de fotos y La Tribuna Vikinga en tiempo real.
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[11px] font-semibold text-white/50">Mérida, Yucatán</span>
                <Button asChild size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold gap-1.5">
                  <Link to="/vikingos">
                    Entrar al Club <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Clubes en proceso / Expansión SaaS */}
            <div className="relative rounded-2xl border border-white/5 bg-[#0A0E18] p-6 text-white/40">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 font-display text-lg font-bold">
                  LM
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white/60">Selección Modelo</h3>
                  <p className="text-xs text-white/40">Liga de Veteranos</p>
                </div>
              </div>
              <p className="mt-4 text-xs">
                Portal institucional y plantilla del equipo en proceso de integración.
              </p>
              <div className="mt-6 border-t border-white/5 pt-4 text-[11px]">
                Próximamente disponible
              </div>
            </div>

            <div className="relative rounded-2xl border border-white/5 bg-[#0A0E18] p-6 text-white/40">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 font-display text-lg font-bold">
                  +
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white/60">Tu Club o Liga</h3>
                  <p className="text-xs text-white/40">Comunidad Personalizada</p>
                </div>
              </div>
              <p className="mt-4 text-xs">
                Crea el espacio digital para tu equipo con dominio propio o subdirectorio en ATOSPORT.
              </p>
              <div className="mt-6 border-t border-white/5 pt-4">
                <Button asChild variant="outline" size="sm" className="w-full border-white/10 text-white hover:bg-white/5">
                  <Link to="/acceso">Registrar Club</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER OFICIAL ATOSPORT */}
      <footer className="mt-20 border-t border-white/10 bg-[#06090E] py-10 text-xs text-white/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white">ATO<span className="text-emerald-400">SPORT</span></span>
            <span>· Plataforma de Gestión de Torneos Deportivos</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/vikingos" className="hover:text-emerald-400 transition-colors">Vikingos FC</Link>
            <Link to="/acceso" className="hover:text-emerald-400 transition-colors">Acceso Interno</Link>
            <a href="#torneo-destacado" className="hover:text-emerald-400 transition-colors">Torneos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
