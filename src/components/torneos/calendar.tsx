import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, FileSpreadsheet, Loader2, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmButton, Field } from "@/components/panel/common";
import { cn } from "@/lib/utils";

export type MatchStatus = "programado" | "reprogramado" | "cancelado" | "jugado";
export const MATCH_STATUS: Record<MatchStatus, string> = {
  programado: "Programado",
  reprogramado: "Reprogramado",
  cancelado: "Cancelado",
  jugado: "Jugado",
};
const tone: Record<MatchStatus, string> = {
  programado: "bg-primary text-primary-foreground",
  reprogramado: "bg-accent text-accent-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
  jugado: "bg-secondary text-muted-foreground",
};

type Round = { id: string; number: number; name: string | null; start_date: string | null; end_date: string | null };
type Match = {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff: string;
  previous_kickoff: string | null;
  status: MatchStatus;
};

function useCalendar(tid: string) {
  return useQuery({
    queryKey: ["tournament_calendar", tid],
    queryFn: async () => {
      const [r, m, n] = await Promise.all([
        supabase.from("tournament_rounds").select("id, number, name, start_date, end_date").eq("tournament_id", tid).order("number"),
        supabase.from("tournament_matches").select("id, round_id, home_team_id, away_team_id, kickoff, previous_kickoff, status").eq("tournament_id", tid).order("kickoff"),
        supabase.rpc("tournament_team_names", { _tournament_id: tid }),
      ]);
      if (r.error) throw r.error;
      if (m.error) throw m.error;
      return {
        rounds: (r.data ?? []) as Round[],
        matches: (m.data ?? []) as Match[],
        teams: (n.data ?? []) as { id: string; name: string }[],
      };
    },
  });
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
const roundLabel = (r?: Round) => (r ? `Jornada ${r.number}${r.name ? ` · ${r.name}` : ""}` : "Jornada");
const pad = (n: number) => String(n).padStart(2, "0");
const splitLocal = (iso: string) => {
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

function MatchCard({
  m, round, names, venue, manager, teams, tid, showRound,
}: {
  m: Match; round?: Round; names: Map<string, string>; venue: string | null; manager: boolean;
  teams: { id: string; name: string }[]; tid: string; showRound?: boolean;
}) {
  const qc = useQueryClient();
  const cancelled = m.status === "cancelado";
  return (
    <article className={cn("rounded-2xl border border-border bg-card p-4 shadow-card", cancelled && "opacity-70")}>
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow text-primary">{showRound ? roundLabel(round) : fmtDate(m.kickoff)}</p>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", tone[m.status])}>
          {MATCH_STATUS[m.status]}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <p className={cn("font-display font-extrabold leading-tight break-words", cancelled && "line-through")}>{names.get(m.home_team_id) ?? "Equipo"}</p>
        <span className="rounded-md bg-secondary px-2 py-1 font-display text-xs font-extrabold text-muted-foreground">VS</span>
        <p className={cn("font-display font-extrabold leading-tight break-words", cancelled && "line-through")}>{names.get(m.away_team_id) ?? "Equipo"}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {showRound && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(m.kickoff)}</span>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTime(m.kickoff)}</span>
        {venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{venue}</span>}
      </div>
      {m.previous_kickoff && (
        <p className="mt-1 text-center text-xs text-muted-foreground">Antes: {fmtDate(m.previous_kickoff)} · {fmtTime(m.previous_kickoff)}</p>
      )}
      {manager && m.status !== "jugado" && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          {!cancelled ? (
            <>
              <MatchDialog tid={tid} roundId={m.round_id} teams={teams} match={m}>
                <Button size="sm" variant="outline" className="w-full"><Pencil className="mr-1 h-4 w-4" /> Reprogramar</Button>
              </MatchDialog>
              <ConfirmButton
                title="Cancelar partido"
                description="El partido seguirá visible en el calendario como CANCELADO."
                confirmLabel="Cancelar partido"
                onConfirm={async () => {
                  const { error } = await supabase.from("tournament_matches").update({ status: "cancelado" }).eq("id", m.id);
                  if (error) return void toast.error(error.message);
                  toast.success("Partido cancelado");
                  qc.invalidateQueries({ queryKey: ["tournament_calendar", tid] });
                }}
              >
                <Button size="sm" variant="ghost" className="w-full text-destructive"><X className="mr-1 h-4 w-4" /> Cancelar</Button>
              </ConfirmButton>
            </>
          ) : (
            <MatchDialog tid={tid} roundId={m.round_id} teams={teams} match={m} reactivate>
              <Button size="sm" variant="outline" className="col-span-2 w-full"><Pencil className="mr-1 h-4 w-4" /> Reprogramar</Button>
            </MatchDialog>
          )}
        </div>
      )}
    </article>
  );
}

function MatchDialog({
  tid, roundId, teams, match, reactivate, children,
}: {
  tid: string; roundId: string; teams: { id: string; name: string }[]; match?: Match; reactivate?: boolean; children: ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const init = () => ({
    home: match?.home_team_id ?? "",
    away: match?.away_team_id ?? "",
    ...(match ? splitLocal(match.kickoff) : { date: "", time: "" }),
  });
  const [f, setF] = useState(init);
  const ids = new Set(teams.map((t) => t.id));

  async function save(again: boolean) {
    if (!f.home) return void toast.error("Elige el equipo local");
    if (!f.away) return void toast.error("Elige el equipo visitante");
    if (f.home === f.away) return void toast.error("Un equipo no puede jugar contra sí mismo");
    if (!ids.has(f.home) || !ids.has(f.away)) return void toast.error("Los equipos deben pertenecer al torneo");
    if (!f.date) return void toast.error("Elige la fecha");
    if (!f.time) return void toast.error("Elige la hora");
    const kickoff = new Date(`${f.date}T${f.time}`).toISOString();
    setBusy(true);
    const { error } = match
      ? await supabase.from("tournament_matches").update({
          home_team_id: f.home, away_team_id: f.away, kickoff,
          ...(reactivate ? { status: "reprogramado" } : {}),
        }).eq("id", match.id)
      : await supabase.from("tournament_matches").insert({ tournament_id: tid, round_id: roundId, home_team_id: f.home, away_team_id: f.away, kickoff });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(match ? "Partido actualizado" : "Partido agregado");
    qc.invalidateQueries({ queryKey: ["tournament_calendar", tid] });
    if (again) setF((p) => ({ ...p, home: "", away: "" }));
    else setOpen(false);
  }

  const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <Dialog open={open} onOpenChange={(v) => { if (busy) return; setOpen(v); if (v) setF(init()); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{match ? "Reprogramar partido" : "Agregar partido"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Equipo local">
            <select className={sel} value={f.home} onChange={(e) => setF((p) => ({ ...p, home: e.target.value }))}>
              <option value="">Selecciona…</option>
              {teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === f.away}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Equipo visitante">
            <select className={sel} value={f.away} onChange={(e) => setF((p) => ({ ...p, away: e.target.value }))}>
              <option value="">Selecciona…</option>
              {teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === f.home}>{t.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha"><Input type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} /></Field>
            <Field label="Hora"><Input type="time" value={f.time} onChange={(e) => setF((p) => ({ ...p, time: e.target.value }))} /></Field>
          </div>
          <p className="text-xs text-muted-foreground">La sede se toma automáticamente del torneo.</p>
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:flex">
          {!match && (
            <Button variant="outline" disabled={busy} onClick={() => save(true)}>
              <Plus className="mr-1 h-4 w-4" /> Guardar y agregar otro
            </Button>
          )}
          <Button disabled={busy} onClick={() => save(false)}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoundDialog({ tid, round, nextNumber, children }: { tid: string; round?: Round; nextNumber: number; children: ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const init = () => ({
    number: String(round?.number ?? nextNumber),
    name: round?.name ?? "",
    start: round?.start_date ?? "",
    end: round?.end_date ?? "",
  });
  const [f, setF] = useState(init);

  async function save() {
    const number = Number(f.number);
    if (!Number.isInteger(number) || number < 1) return void toast.error("Número de jornada no válido");
    if (f.start && f.end && f.end < f.start) return void toast.error("La fecha final no puede ser antes de la inicial");
    setBusy(true);
    const row = { number, name: f.name.trim().slice(0, 60) || null, start_date: f.start || null, end_date: f.end || null };
    const { error } = round
      ? await supabase.from("tournament_rounds").update(row).eq("id", round.id)
      : await supabase.from("tournament_rounds").insert({ ...row, tournament_id: tid });
    setBusy(false);
    if (error) return void toast.error(error.code === "23505" ? `Ya existe la Jornada ${number}` : error.message);
    toast.success(round ? "Jornada actualizada" : `Jornada ${number} creada`);
    qc.invalidateQueries({ queryKey: ["tournament_calendar", tid] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (busy) return; setOpen(v); if (v) setF(init()); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{round ? "Editar jornada" : "Crear jornada"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Número de jornada"><Input type="number" min={1} inputMode="numeric" value={f.number} onChange={(e) => setF((p) => ({ ...p, number: e.target.value }))} /></Field>
          <Field label="Nombre (opcional)"><Input value={f.name} maxLength={60} placeholder="Ej. Clásico" onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicial"><Input type="date" value={f.start} onChange={(e) => setF((p) => ({ ...p, start: e.target.value }))} /></Field>
            <Field label="Fecha final"><Input type="date" value={f.end} onChange={(e) => setF((p) => ({ ...p, end: e.target.value }))} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={busy} onClick={save}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
      <p className="mt-3 font-display font-bold">{text}</p>
    </div>
  );
}

const dRange = (r: Round) => {
  const f = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  if (r.start_date && r.end_date) return `${f(r.start_date)} – ${f(r.end_date)}`;
  return r.start_date ? f(r.start_date) : r.end_date ? f(r.end_date) : null;
};

export function Jornadas({ tid, venue, manager }: { tid: string; venue: string | null; manager: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useCalendar(tid);
  if (isLoading || !data) return null;
  const { rounds, matches, teams } = data;
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const next = (rounds.at(-1)?.number ?? 0) + 1;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold">Jornadas</h2>
        {manager && (
          <RoundDialog tid={tid} nextNumber={next}>
            <Button><Plus className="mr-1 h-4 w-4" /> Crear jornada</Button>
          </RoundDialog>
        )}
      </div>
      {rounds.length === 0 ? (
        <Empty text="Aún no hay jornadas creadas." />
      ) : (
        <div className="space-y-6">
          {rounds.map((r) => {
            const list = matches.filter((m) => m.round_id === r.id);
            if (!manager && list.length === 0) return null;
            return (
              <section key={r.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-extrabold">{roundLabel(r)}</h3>
                    <p className="text-xs text-muted-foreground">{[dRange(r), `${list.length} partido${list.length === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  {manager && (
                    <div className="flex gap-1">
                      <MatchDialog tid={tid} roundId={r.id} teams={teams}>
                        <Button size="sm" disabled={teams.length < 2}><Plus className="mr-1 h-4 w-4" /> Agregar partido</Button>
                      </MatchDialog>
                      <RoundDialog tid={tid} round={r} nextNumber={next}>
                        <Button size="icon" variant="ghost" aria-label="Editar jornada"><Pencil className="h-4 w-4" /></Button>
                      </RoundDialog>
                      {list.length === 0 && (
                        <ConfirmButton
                          title="Eliminar jornada"
                          description="La jornada no tiene partidos."
                          onConfirm={async () => {
                            const { error } = await supabase.from("tournament_rounds").delete().eq("id", r.id);
                            if (error) return void toast.error(error.message);
                            toast.success("Jornada eliminada");
                            qc.invalidateQueries({ queryKey: ["tournament_calendar", tid] });
                          }}
                        >
                          <Button size="icon" variant="ghost" className="text-destructive" aria-label="Eliminar jornada"><Trash2 className="h-4 w-4" /></Button>
                        </ConfirmButton>
                      )}
                    </div>
                  )}
                </div>
                {manager && teams.length < 2 && <p className="mb-2 text-xs text-muted-foreground">Registra al menos 2 equipos para agregar partidos.</p>}
                {list.length === 0 ? (
                  <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">Sin partidos todavía.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {list.map((m) => (
                      <MatchCard key={m.id} m={m} names={names} venue={venue} manager={manager} teams={teams} tid={tid} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export function Calendario({ tid, venue, manager }: { tid: string; venue: string | null; manager: boolean }) {
  const { data, isLoading } = useCalendar(tid);
  const [view, setView] = useState<"fecha" | "jornada">("fecha");
  if (isLoading || !data) return null;
  const { rounds, matches, teams } = data;
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const rmap = new Map(rounds.map((r) => [r.id, r]));
  const byRound = [...matches].sort((a, b) => (rmap.get(a.round_id)?.number ?? 0) - (rmap.get(b.round_id)?.number ?? 0) || a.kickoff.localeCompare(b.kickoff));
  const list = view === "fecha" ? matches : byRound;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold">Calendario</h2>
        {manager && (
          <Button variant="outline" size="sm" onClick={() => toast.info("Importar calendario: disponible próximamente")}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Importar calendario
          </Button>
        )}
      </div>
      <div className="mb-4 flex gap-1">
        {(["fecha", "jornada"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={cn("h-8 rounded-full px-3 text-xs font-bold uppercase tracking-wide", view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            {v === "fecha" ? "Por fecha" : "Por jornada"}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty text={manager ? "Aún no hay partidos. Créalos desde Jornadas." : "Aún no hay partidos programados para tu equipo."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <MatchCard key={m.id} m={m} round={rmap.get(m.round_id)} names={names} venue={venue} manager={manager} teams={teams} tid={tid} showRound />
          ))}
        </div>
      )}
    </>
  );
}
