import { createFileRoute } from "@tanstack/react-router";

import { AppShell, Crest, PageHeader } from "@/components/vk/shell";
import { BRAND } from "@/lib/brand";
import { useClub } from "@/lib/queries";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "El Club — Vikingos FC, fundado en 2017" },
      {
        name: "description",
        content:
          "Historia, identidad, sede y valores de Vikingos FC, club de la Liga de Veteranos de la Escuela Modelo en Mérida, Yucatán.",
      },
      { property: "og:title", content: "El Club — Vikingos FC" },
      {
        property: "og:description",
        content: "Historia e identidad de Vikingos FC desde 2017 en Mérida, Yucatán.",
      },
    ],
  }),
  component: Club,
});

function Section({ title, body }: { title: string; body?: string | null | undefined }) {
  if (!body) return null;
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="eyebrow text-muted-foreground">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{body}</p>
    </article>
  );
}

function Club() {
  const { data: club } = useClub();

  return (
    <AppShell>
      <ManagedSiteImage imageKey="club_team" title="Foto oficial del equipo">
      <section className="relative">
        <SiteImage
          imageKey="club_team"
          fallbackSrc={BRAND.team}
          alt="Plantel de Vikingos FC"
          className="h-60 w-full object-cover object-top sm:h-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,oklch(0.18_0.06_262/0.92)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-5 pb-5 text-white">
          <Crest className="h-16 w-16" />
          <div>
            <h1 className="font-display text-3xl font-black leading-none">
              {club?.name ?? BRAND.name}
            </h1>
            <p className="eyebrow mt-1.5 text-white/60">Fundado {club?.founded ?? BRAND.founded}</p>
          </div>
        </div>
      </section>

      <div className="space-y-4 px-4 py-6 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-secondary p-4">
            <p className="eyebrow text-muted-foreground">Liga</p>
            <p className="mt-1 font-display text-lg font-extrabold">{club?.league ?? BRAND.league}</p>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <p className="eyebrow text-muted-foreground">Ciudad</p>
            <p className="mt-1 font-display text-lg font-extrabold">{club?.city ?? BRAND.city}</p>
          </div>
        </div>

        <Section title="Historia" body={club?.history} />
        <Section title="Identidad y valores" body={club?.identity} />
        <Section title="Sede y cancha" body={club?.venue_info} />
        <Section title="Patrocinadores y apoyos" body={club?.sponsors} />

        <PageHeader eyebrow="Identidad visual" title="Colores y uniforme" />
        <div className="grid gap-3 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <img
              src={BRAND.kit}
              alt="Uniforme oficial de Vikingos FC"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="p-3 text-sm font-semibold">Uniforme de juego</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <img
              src={BRAND.pitch}
              alt="Cancha donde juega Vikingos FC"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="p-3 text-sm font-semibold">Nuestra cancha</figcaption>
          </figure>
        </div>
      </div>
    </AppShell>
  );
}
