import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTournaments } from "@/lib/tournaments";
import { TournamentCard } from "@/components/torneos/tournament-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/torneos/")({
  head: () => ({
    meta: [
      { title: "Mis torneos — Gestión Deportiva" },
      { name: "description", content: "Torneos de fútbol que administras o donde representas a un equipo." },
      { property: "og:title", content: "Mis torneos — Gestión Deportiva" },
      { property: "og:description", content: "Tus torneos de fútbol." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyTournaments,
});

function MyTournaments() {
  const { profile, loading } = useAuth();
  const { data = [], isLoading } = useTournaments();
  if (loading) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Inicio</Link>
        </Button>
        <p className="eyebrow text-muted-foreground">Fútbol</p>
        <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Mis torneos</h1>
        {!profile ? (
          <Button asChild><Link to="/acceso">Iniciar sesión</Link></Button>
        ) : isLoading ? null : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-display text-lg font-bold">No tienes torneos asignados.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Cuando la liga te asigne como administrador o representante de equipo, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t) => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </main>
    </div>
  );
}
