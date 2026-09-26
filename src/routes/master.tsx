import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Network,
  Plus,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Crest } from "@/components/vk/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/master")({
  head: () => ({
    meta: [
      { title: "Panel Master — Gestión Deportiva" },
      { name: "description", content: "Administración central de redes sociales deportivas y torneos." },
      { property: "og:title", content: "Panel Master — Gestión Deportiva" },
      { property: "og:description", content: "Administración central de comunidades deportivas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MasterPage,
});

type Section = "resumen" | "redes" | "torneos";

const SECTIONS: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "redes", label: "Redes sociales", icon: Network },
  { id: "torneos", label: "Torneos", icon: Trophy },
];

// Registro de comunidades. Vikingos FC es la primera y usa sus datos actuales.
const COMMUNITIES = [
  { id: "vikingos-fc", name: "VIKINGOS FC", sport: "Fútbol", active: true, adminTo: "/panel" as const },
];

function MasterPage() {
  const { isMaster, loading } = useAuth();
  const [section, setSection] = useState<Section>("resumen");

  if (loading) return <div className="min-h-screen bg-background" />;

  if (!isMaster)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-extrabold">Acceso exclusivo del Master</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Esta área solo está disponible para la cuenta Master.</p>
        <Button asChild><Link to="/">Volver al inicio</Link></Button>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card p-5 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                section === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </nav>
        <Button asChild variant="ghost" className="mt-auto justify-start">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Salir a Vikingos FC</Link>
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <Brand />
          <Button asChild size="icon" variant="ghost" aria-label="Salir">
            <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-10 lg:pt-10">
          {section === "resumen" && <Resumen onGo={setSection} />}
          {section === "redes" && <Redes />}
          {section === "torneos" && <Torneos />}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg px-2 pt-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide",
                  section === s.id ? "text-primary" : "text-muted-foreground",
                )}
              >
                <s.icon className="h-5 w-5" /> {s.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <LayoutDashboard className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-extrabold tracking-tight">PANEL MASTER</p>
        <p className="text-xs text-muted-foreground">Gestión Deportiva</p>
      </div>
    </div>
  );
}

function Title({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function useCounts() {
  return useQuery({
    queryKey: ["master_counts"],
    queryFn: async () => {
      const [p, t] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }),
        supabase.from("standings_teams").select("id", { count: "exact", head: true }),
      ]);
      return { players: p.count ?? 0, teams: t.count ?? 0 };
    },
  });
}

function Resumen({ onGo }: { onGo: (s: Section) => void }) {
  const { data } = useCounts();
  const cards = [
    { label: "Redes sociales activas", value: COMMUNITIES.filter((c) => c.active).length, icon: Network },
    { label: "Equipos", value: data?.teams, icon: Shield },
    { label: "Jugadores", value: data?.players, icon: Users },
  ];
  return (
    <>
      <Title eyebrow="Panel Master" title="Resumen" />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 font-display text-4xl font-extrabold tabular-nums">{c.value ?? "—"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <QuickLink icon={Network} title="Redes sociales" hint="Administra tus comunidades deportivas" onClick={() => onGo("redes")} />
        <QuickLink icon={Trophy} title="Torneos" hint="Próximamente" onClick={() => onGo("torneos")} />
      </div>
    </>
  );
}

function QuickLink({ icon: Icon, title, hint, onClick }: { icon: typeof Trophy; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:border-primary">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function Soon({ label }: { label: string }) {
  return (
    <Button onClick={() => toast.info(`${label}: disponible próximamente`)}>
      <Plus className="mr-1 h-4 w-4" /> {label}
    </Button>
  );
}

function Redes() {
  return (
    <>
      <Title eyebrow="Comunidades" title="Redes sociales" action={<Soon label="Crear red social" />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMMUNITIES.map((c) => (
          <article key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-4">
              <Crest className="h-16 w-16" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-extrabold">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.sport}</p>
              </div>
            </div>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-primary" /> {c.active ? "Activa" : "Inactiva"}
            </span>
            <Button asChild className="mt-5 w-full">
              <Link to={c.adminTo}>Administrar <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}

function Torneos() {
  return (
    <>
      <Title eyebrow="Competencias" title="Torneos" action={<Soon label="Crear torneo" />} />
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 font-display text-lg font-bold">Aún no hay torneos registrados.</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Esta sección se habilitará en una próxima etapa.</p>
      </div>
    </>
  );
}
