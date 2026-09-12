import { useMedia } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useSponsors, type Sponsor } from "@/lib/queries";

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
  const url = useMedia(sponsor.logo_url);
  if (!url) return null;
  return (
    <a
      href={sponsor.destination_url}
      target="_blank"
      rel="noopener noreferrer external"
      aria-label={sponsor.name}
      className="flex min-h-24 items-center justify-center rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-card"
    >
      <img
        src={url}
        alt={sponsor.name}
        loading="lazy"
        className="max-h-20 w-full object-contain"
      />
    </a>
  );
}

export function SponsorsSection({ className }: { className?: string }) {
  const { data: sponsors = [] } = useSponsors();
  const active = sponsors.filter((s) => s.is_active);
  if (active.length === 0) return null;

  return (
    <section className={cn("", className)}>
      <div className="text-center">
        <h2 className="font-display text-xl font-extrabold">Patrocinadores oficiales</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Empresas que juegan con Vikingos FC.
        </p>
      </div>
      <div
        className={cn(
          "mx-auto mt-4 grid max-w-3xl gap-3",
          active.length === 1 ? "max-w-xs grid-cols-1" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {active.map((s) => (
          <SponsorLogo key={s.id} sponsor={s} />
        ))}
      </div>
    </section>
  );
}
