import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/panel/common";
import { SiteImage, SiteImageEditor } from "@/components/vk/site-image";
import { BRAND } from "@/lib/brand";
import {
  useMatches,
  useMediaLibrary,
  usePlayers,
  useSiteImages,
  type SiteImageKey,
} from "@/lib/queries";

const ITEMS: {
  key: SiteImageKey;
  title: string;
  fallback: string;
  hint: string;
}[] = [
  {
    key: "hero",
    title: "Imagen principal de Inicio",
    fallback: BRAND.team,
    hint: "Automático u horizontal recomendado.",
  },
  {
    key: "club_logo",
    title: "Logotipo oficial",
    fallback: BRAND.crest,
    hint: "Se muestra tal cual, sin filtros ni recortes.",
  },
  {
    key: "club_team",
    title: "Foto oficial del equipo",
    fallback: BRAND.team,
    hint: "Automático u horizontal recomendado.",
  },
  {
    key: "club_kit",
    title: "Uniforme",
    fallback: BRAND.kit,
    hint: "Automático según el archivo.",
  },
  {
    key: "club_pitch",
    title: "Cancha",
    fallback: BRAND.pitch,
    hint: "Automático u horizontal recomendado.",
  },
];

function Pending({ done, total, label }: { done: number; total: number; label: string }) {
  const missing = Math.max(total - done, 0);
  return (
    <div className="rounded-lg bg-secondary p-3">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {missing === 0 ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-accent-foreground" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        )}
        {total} en total · {done} con imagen · {missing} pendientes
      </p>
    </div>
  );
}

export function InstitutionalPanel() {
  const { data: images } = useSiteImages();
  const { data: players = [] } = usePlayers();
  const { data: matches = [] } = useMatches();
  const { data: media = [] } = useMediaLibrary();

  const withPhoto = players.filter((p) => !!p.photo_url).length;
  const matchesWithMedia = matches.filter((m) =>
    media.some((x) => x.match_id === m.id),
  ).length;
  const finished = matches.filter((m) => m.status === "finalizado");
  const mvpDone = finished.filter((m) => {
    const p = players.find((x) => x.id === m.mvp_player_id);
    return !!p?.photo_url;
  }).length;
  const vikingadas = matches.filter((m) => m.vikingada_title);
  const vikingadaDone = vikingadas.filter((m) => !!m.vikingada_media_url).length;

  return (
    <>
      <PanelCard title="Imágenes institucionales">
        <p className="text-sm text-muted-foreground">
          Cada imagen tiene su propia referencia. Cambiar una no afecta las fotografías de
          partidos, jugadores, MVP, Vikingada ni Vikingoteca.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div
              key={item.key}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <SiteImage
                imageKey={item.key}
                fallbackSrc={item.fallback}
                alt={item.title}
                className="aspect-video w-full bg-secondary object-contain"
              />
              <div className="space-y-2 p-3">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {images?.[item.key] ? "Imagen personalizada activa." : "Usando la imagen original."}{" "}
                  {item.hint}
                </p>
                <SiteImageEditor
                  imageKey={item.key}
                  title={item.title}
                  variant="outline"
                  label="Cambiar imagen"
                />
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Imágenes pendientes">
        <div className="grid gap-2 sm:grid-cols-2">
          <Pending label="Plantilla" total={players.length} done={withPhoto} />
          <Pending label="Partidos con fotografías" total={matches.length} done={matchesWithMedia} />
          <Pending label="MVP con fotografía" total={finished.length} done={mvpDone} />
          <Pending label="Vikingadas con imagen" total={vikingadas.length} done={vikingadaDone} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/plantilla">Ver plantilla</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/partidos">Ver partidos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/vikingoteca">Ver Vikingoteca</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/club">Ver El Club</Link>
          </Button>
        </div>
      </PanelCard>
    </>
  );
}
