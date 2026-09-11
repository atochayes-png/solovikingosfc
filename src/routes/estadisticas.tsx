import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeClubTotals,
  computePlayerTotals,
  useLineups,
  useMatchEvents,
  useMatches,
  usePlayers,
  useSeasons,
  type PlayerTotals,
} from "@/lib/queries";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas — Vikingos FC" },
      {
        name: "description",
        content:
          "Tabla de goleadores, asistencias, tarjetas y MVP de Vikingos FC, además del balance del club por temporada.",
      },
      { property: "og:title", content: "Estadísticas — Vikingos FC" },
      { property: "og:description", content: "Números oficiales de Vikingos FC por temporada." },
    ],
  }),
  component: Estadisticas,
});

type Row = { id: string; name: string } & PlayerTotals;

function Table({ rows, metric }: { rows: Row[]; metric: keyof PlayerTotals }) {
  const sorted = rows.filter((r) => r[metric] > 0).sort((a, b) => b[metric] - a[metric]);
  if (sorted.length === 0) return <EmptyState title="Todavía no hay datos registrados." />;
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {sorted.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 px-4 py-3">
          <span className="w-5 font-display text-sm font-black text-muted-foreground">{i + 1}</span>
          <Link
            to="/plantilla/$id"
            params={{ id: r.id }}
            className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline"
          >
            {r.name}
          </Link>
          <span className="font-display text-xl font-black tabular-nums">{r[metric]}</span>
        </li>
      ))}
    </ol>
  );
}

function Estadisticas() {
  const { data: seasons = [] } = useSeasons();
  const { data: players = [] } = usePlayers();
  const { data: matches = [] } = useMatches();
  const { data: events = [] } = useMatchEvents();
  const { data: lineups = [] } = useLineups();
  const [season, setSeason] = useState<string>("all");

  const seasonId = season === "all" ? null : season;
  const club = computeClubTotals(matches, seasonId);
  const totalsMap = computePlayerTotals(matches, events, lineups, seasonId);

  const rows: Row[] = players.map((p) => ({
    id: p.id,
    name: p.nickname || p.full_name,
    ...(totalsMap.get(p.id) ?? {
      pj: 0,
      goles: 0,
      asistencias: 0,
      amarillas: 0,
      rojas: 0,
      mvp: 0,
    }),
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Números del club"
        title="Estadísticas"
        description="Calculadas a partir de los partidos finalizados y sus incidencias."
        action={
          seasons.length > 0 ? (
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Temporada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las temporadas</SelectItem>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      <div className="space-y-6 px-4 pb-6 sm:px-6">
        <section className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {[
            { l: "PJ", v: club.pj },
            { l: "PG", v: club.pg },
            { l: "PE", v: club.pe },
            { l: "PP", v: club.pp },
            { l: "GF", v: club.gf },
            { l: "GC", v: club.gc },
            { l: "DG", v: club.dg > 0 ? `+${club.dg}` : club.dg },
            { l: "PTS", v: club.pts },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-border bg-card py-3 text-center shadow-card"
            >
              <p className="font-display text-xl font-black tabular-nums">{s.v}</p>
              <p className="eyebrow text-[9px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </section>

        <Tabs defaultValue="goles">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goles">Goles</TabsTrigger>
            <TabsTrigger value="asistencias">Asist.</TabsTrigger>
            <TabsTrigger value="mvp">MVP</TabsTrigger>
            <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
          </TabsList>
          <TabsContent value="goles" className="mt-4">
            <Table rows={rows} metric="goles" />
          </TabsContent>
          <TabsContent value="asistencias" className="mt-4">
            <Table rows={rows} metric="asistencias" />
          </TabsContent>
          <TabsContent value="mvp" className="mt-4">
            <Table rows={rows} metric="mvp" />
          </TabsContent>
          <TabsContent value="tarjetas" className="mt-4 space-y-4">
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Amarillas</p>
              <Table rows={rows} metric="amarillas" />
            </div>
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Rojas</p>
              <Table rows={rows} metric="rojas" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
