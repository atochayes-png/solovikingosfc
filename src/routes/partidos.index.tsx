import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { StorageImage } from "@/components/vk/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMatches, type Match } from "@/lib/queries";

export const Route = createFileRoute("/partidos/")({
  head: () => ({
    meta: [
      { title: "Partidos y resultados — Vikingos FC" },
      {
        name: "description",
        content:
          "Calendario de próximos partidos y resultados oficiales de Vikingos FC en la Liga de Veteranos de la Escuela Modelo.",
      },
      { property: "og:title", content: "Partidos y resultados — Vikingos FC" },
      {
        property: "og:description",
        content: "Próximos encuentros y resultados de Vikingos FC.",
      },
    ],
  }),
  component: Partidos,
});

function MatchCard({ match }: { match: Match }) {
  const finished = match.status === "finalizado" && match.goals_for !== null;
  return (
    <Link
      to="/partidos/$id"
      params={{ id: match.id }}
      className="block rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow text-muted-foreground">
          {match.matchday ? `Jornada ${match.matchday}` : "Partido"} ·{" "}
          {match.is_home ? "Local" : "Visitante"}
        </p>
        {match.status !== "programado" && match.status !== "finalizado" && (
          <Badge variant="secondary" className="capitalize">
            {match.status}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        {match.opponent_crest_url ? (
          <StorageImage
            path={match.opponent_crest_url}
            alt={`Escudo de ${match.opponent}`}
            className="h-11 w-11 rounded-full"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary font-display text-lg font-black text-secondary-foreground">
            {match.opponent.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-extrabold">vs {match.opponent}</p>
          <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
            {match.kickoff && (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(match.kickoff), "d MMM yyyy · HH:mm 'h'", { locale: es })}
              </p>
            )}
            {match.venue && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {match.venue}
              </p>
            )}
          </div>
        </div>
        {finished && (
          <div className="shrink-0 rounded-lg bg-primary px-3 py-2 text-center text-primary-foreground">
            <p className="font-display text-xl font-black tabular-nums">
              {match.goals_for}-{match.goals_against}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

function Partidos() {
  const { data: matches = [], isLoading } = useMatches();

  const upcoming = matches
    .filter((m) => m.status === "programado" || m.status === "aplazado")
    .sort((a, b) => new Date(a.kickoff ?? 0).getTime() - new Date(b.kickoff ?? 0).getTime());
  const results = matches.filter((m) => m.status === "finalizado");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendario oficial"
        title="Partidos"
        description="Próximos encuentros y resultados registrados por el club."
      />
      <div className="px-4 sm:px-6">
        <Tabs defaultValue="proximos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>
          <TabsContent value="proximos" className="mt-4 space-y-3">
            {isLoading ? null : upcoming.length === 0 ? (
              <EmptyState title="Aún no hay partidos programados." />
            ) : (
              upcoming.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </TabsContent>
          <TabsContent value="resultados" className="mt-4 space-y-3">
            {isLoading ? null : results.length === 0 ? (
              <EmptyState title="Todavía no se han registrado resultados." />
            ) : (
              results.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
