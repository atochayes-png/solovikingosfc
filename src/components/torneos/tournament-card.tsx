import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOURNAMENT_STATUS, statusTone, type Tournament } from "@/lib/tournaments";

export function TournamentCard({ t }: { t: Tournament }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-extrabold">{t.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            Fútbol{t.category ? ` · ${t.category}` : ""}{t.season ? ` · ${t.season}` : ""}
          </p>
        </div>
      </div>
      {t.venue && (
        <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {t.venue}
        </p>
      )}
      <span className={cn("mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold", statusTone(t.status))}>
        {TOURNAMENT_STATUS[t.status]}
      </span>
      <Button asChild className="mt-5 w-full">
        <Link to="/torneos/$id" params={{ id: t.id }}>
          Abrir torneo <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}
