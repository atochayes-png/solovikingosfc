import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { useStandings } from "@/lib/standings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tabla")({
  head: () => ({
    meta: [
      { title: "Tabla de posiciones — Vikingos FC" },
      { name: "description", content: "Clasificación oficial de la liga y la posición de Vikingos FC." },
      { property: "og:title", content: "Tabla de posiciones — Vikingos FC" },
      { property: "og:description", content: "Consulta la clasificación de la liga y los puntos de Vikingos FC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tabla,
});

const COLS = ["PJ", "G", "E", "P", "GF", "GC"] as const;

function Tabla() {
  const { data, isLoading } = useStandings();
  const teams = data?.teams ?? [];
  const ppw = data?.settings.points_per_win ?? 3;
  const vik = teams.find((t) => t.is_vikingos);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Clasificación oficial"
        title="Tabla de posiciones"
        description="Datos capturados por la administración del club con la información oficial de la liga."
      />
      <div className="space-y-6 px-4 pb-8 sm:px-6">
        {isLoading ? null : teams.length === 0 ? (
          <EmptyState
            title="La tabla todavía no se ha capturado."
            hint="En cuanto la administración registre la clasificación oficial aparecerá aquí."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-muted-foreground">
                  <th className="eyebrow sticky left-0 z-10 w-10 bg-secondary px-3 py-2.5 text-left text-[10px]">#</th>
                  <th className="eyebrow sticky left-10 z-10 bg-secondary px-2 py-2.5 text-left text-[10px]">Equipo</th>
                  {COLS.map((c) => (
                    <th key={c} className="eyebrow px-2 py-2.5 text-center text-[10px]">{c}</th>
                  ))}
                  <th className="eyebrow px-3 py-2.5 text-center text-[10px] text-foreground">PTS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const hl = t.is_vikingos;
                  const bg = hl ? "bg-primary text-primary-foreground" : "bg-card";
                  return (
                    <tr key={t.id} className={cn("border-b border-border last:border-0", bg)}>
                      <td className={cn("sticky left-0 z-10 px-3 py-3 font-display font-black tabular-nums", bg)}>{i + 1}</td>
                      <td className={cn("sticky left-10 z-10 max-w-[10rem] truncate px-2 py-3 font-semibold", bg)}>{t.name}</td>
                      {[t.pj, t.g, t.e, t.p, t.gf, t.gc].map((v, j) => (
                        <td key={j} className={cn("px-2 py-3 text-center tabular-nums", !hl && "text-muted-foreground")}>{v}</td>
                      ))}
                      <td className="px-3 py-3 text-center font-display text-base font-black tabular-nums">{t.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {vik && (
          <section className="surface-navy rounded-xl p-5">
            <p className="eyebrow flex items-center gap-1.5 text-white/70">
              <Target className="h-3.5 w-3.5" /> Nuestro próximo objetivo
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-white/10 py-4">
                <p className="font-display text-3xl font-black tabular-nums">{vik.pts}</p>
                <p className="eyebrow mt-1 text-[9px] text-white/70">Puntos actuales</p>
              </div>
              <div className="rounded-lg bg-white/10 py-4">
                <p className="font-display text-3xl font-black tabular-nums">{vik.pts + ppw * 2}</p>
                <p className="eyebrow mt-1 text-[9px] text-white/70">Ganando los próximos 2</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
