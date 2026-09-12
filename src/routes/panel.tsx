import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersPanel } from "@/components/panel/players-panel";
import { MatchesPanel } from "@/components/panel/matches-panel";
import { ResultsPanel } from "@/components/panel/results-panel";
import { MediaPanel } from "@/components/panel/media-panel";
import { ClubPanel } from "@/components/panel/club-panel";
import { UsersPanel } from "@/components/panel/users-panel";
import { SponsorsPanel } from "@/components/panel/sponsors-panel";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de administración — Vikingos FC" },
      {
        name: "description",
        content: "Gestión interna de jugadores, partidos, resultados y contenidos de Vikingos FC.",
      },
      { property: "og:title", content: "Panel — Vikingos FC" },
      { property: "og:description", content: "Área de administración del club." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const { isStaff, isMaster, loading, session } = useAuth();

  if (loading) return <AppShell>{null}</AppShell>;

  if (!session || !isStaff)
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState
            title="Área restringida."
            hint="Solo el Master y los Administradores pueden entrar al panel."
            action={
              <Button asChild>
                <Link to="/acceso">Iniciar sesión</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader
        eyebrow={isMaster ? "Panel Master" : "Panel Administrador"}
        title="Administración"
        description="Todo lo que se publica en la plataforma se captura desde aquí."
      />
      <div className="px-4 pb-8 sm:px-6">
        <Tabs defaultValue="jugadores">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="jugadores">Jugadores</TabsTrigger>
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="vikingoteca">Vikingoteca</TabsTrigger>
            <TabsTrigger value="club">El Club</TabsTrigger>
            <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
            {isMaster && <TabsTrigger value="patrocinadores">Patrocinadores</TabsTrigger>}
          </TabsList>

          <TabsContent value="jugadores" className="mt-4">
            <PlayersPanel />
          </TabsContent>
          <TabsContent value="partidos" className="mt-4">
            <MatchesPanel />
          </TabsContent>
          <TabsContent value="resultados" className="mt-4">
            <ResultsPanel />
          </TabsContent>
          <TabsContent value="vikingoteca" className="mt-4">
            <MediaPanel />
          </TabsContent>
          <TabsContent value="club" className="mt-4 space-y-4">
            <ClubPanel />
          </TabsContent>
          <TabsContent value="cuentas" className="mt-4 space-y-4">
            <UsersPanel />
          </TabsContent>
          {isMaster && (
            <TabsContent value="patrocinadores" className="mt-4 space-y-4">
              <SponsorsPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}
