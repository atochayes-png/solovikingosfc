import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTournaments } from "@/lib/tournaments";
import { TournamentCard } from "@/components/torneos/tournament-card";
import { TournamentFormDialog } from "@/components/torneos/tournament-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  if (loading) {
    return <div className="dark min-h-screen bg-[#070A0F] text-[#E2E8F0]" />;
  }

  return (
    <div className="dark min-h-screen bg-[#070A0F] text-[#E2E8F0] [--card:#0B0F17] [--border:#1E293B]">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-slate-400 hover:bg-white/5 hover:text-white">
          <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Inicio</Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-slate-400">Fútbol</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Mis torneos</h1>
          </div>

          {profile ? (
            <TournamentFormDialog>
              <Button className="bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500">
                <Plus className="mr-1.5 h-4 w-4" /> + Nuevo Torneo
              </Button>
            </TournamentFormDialog>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500">
                  <Plus className="mr-1.5 h-4 w-4" /> + Nuevo Torneo
                </Button>
              </DialogTrigger>
              <DialogContent className="border-[#1E293B] bg-[#0B0F17] text-[#E2E8F0] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl font-bold text-white">
                    Crear nuevo torneo
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-400">
                    Para crear y administrar un torneo de fútbol, te invitamos a iniciar sesión o acceder al formulario de registro.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <Button asChild className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500">
                    <Link to="/acceso">Iniciar sesión / Acceso</Link>
                  </Button>
                  <TournamentFormDialog>
                    <Button variant="outline" className="w-full border-[#1E293B] text-slate-300 hover:bg-white/5 hover:text-white">
                      Abrir formulario de registro
                    </Button>
                  </TournamentFormDialog>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1E293B] bg-[#0B0F17] px-6 py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-500/50" />
            <p className="mt-4 font-display text-lg font-bold text-white">No tienes torneos asignados.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
              {profile
                ? "Cuando la liga te asigne como administrador o representante de equipo, aparecerá aquí. También puedes crear un torneo nuevo."
                : "Inicia sesión para gestionar tus torneos asignados o crea un nuevo torneo con el botón superior."}
            </p>
            {!profile && (
              <div className="mt-5">
                <Button asChild variant="outline" className="border-[#1E293B] bg-transparent text-slate-200 hover:bg-white/5">
                  <Link to="/acceso">Iniciar sesión</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_article]:border-[#1E293B] [&_article]:bg-[#0B0F17] [&_article]:shadow-none">
            {data.map((t) => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </main>
    </div>
  );
}
