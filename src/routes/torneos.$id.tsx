import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  ListOrdered,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmButton } from "@/components/panel/common";
import { TournamentFormDialog } from "@/components/torneos/tournament-form";
import { TeamFormDialog } from "@/components/torneos/team-form";
import { PlayerFormDialog } from "@/components/torneos/player-form";
import { Calendario, Jornadas } from "@/components/torneos/calendar";
import { cn } from "@/lib/utils";
import {
  REG_STATUS,
  TEAM_STATUS,
  TOURNAMENT_STATUS,
  findProfileByUsername,
  signedTeamFile,
  statusTone,
  useLeagueAdmins,
  useRegistrations,
  useTeamFile,
  useTeams,
  useTournament,
  useTournamentRole,
  type RegStatus,
  type Registration,
  type Team,
} from "@/lib/tournaments";

export const Route = createFileRoute("/torneos/$id")({
  head: () => ({
    meta: [
      { title: "Torneo de fútbol — Gestión Deportiva" },
      { name: "description", content: "Panel del torneo: equipos, representantes y plantillas." },
      { property: "og:title", content: "Torneo de fútbol — Gestión Deportiva" },
      { property: "og:description", content: "Panel del torneo de fútbol." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TournamentPage,
});

type Tab = "resumen" | "equipos" | "jugadores" | "calendario" | "jornadas";
const FUTURE = [
  { label: "Resultados", icon: Check },
  { label: "Tabla", icon: ListOrdered },
  { label: "Goleadores", icon: Users },
  { label: "Asistencia", icon: UserCheck },
  { label: "Disciplina", icon: Shield },
];

function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", statusTone(status))}>
      {label}
    </span>
  );
}

function TournamentPage() {
  const { id } = Route.useParams();
  const { profile, isMaster, loading } = useAuth();
  const { data: t, isLoading } = useTournament(id);
  const { data: role } = useTournamentRole(id, profile?.id, isMaster);
  const manager = !!role?.manager;
  const { data: teams = [] } = useTeams(id);
  const { data: regs = [] } = useRegistrations(teams.map((x) => x.id));
  const [tab, setTab] = useState<Tab>("resumen");
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  if (loading || isLoading) return <div className="min-h-screen bg-background" />;
  if (!profile || !t)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-extrabold">Torneo no disponible</h1>
        <p className="max-w-sm text-sm text-muted-foreground">No tienes acceso a este torneo o no existe.</p>
        <Button asChild><Link to={profile ? "/torneos" : "/acceso"}>{profile ? "Mis torneos" : "Iniciar sesión"}</Link></Button>
      </div>
    );

  const team = teams.find((x) => x.id === openTeam) ?? null;
  const tabs: { id: Tab; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "equipos", label: manager ? "Equipos" : "Mi equipo" },
    { id: "jugadores", label: "Jugadores" },
    { id: "calendario", label: "Calendario" },
    { id: "jornadas", label: "Jornadas" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-4 sm:px-8">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to={isMaster ? "/master" : "/torneos"}><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-primary">Fútbol{t.category ? ` · ${t.category}` : ""}</p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {t.season && <span>{t.season}</span>}
                {t.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.venue}</span>}
                <Badge status={t.status} label={TOURNAMENT_STATUS[t.status]} />
              </div>
            </div>
            {manager && (
              <TournamentFormDialog tournament={t}>
                <Button variant="outline" size="sm"><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
              </TournamentFormDialog>
            )}
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
                  tab === x.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {x.label}
              </button>
            ))}
            {FUTURE.map((x) => (
              <span key={x.label} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-4 text-sm text-muted-foreground/60">
                <Lock className="h-3 w-3" /> {x.label}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-8">
        {tab === "resumen" && <Resumen t={t} teams={teams} regs={regs} manager={manager} isMaster={isMaster} />}
        {tab === "equipos" && (
          <Equipos tournamentId={id} teams={teams} regs={regs} manager={manager} onOpen={setOpenTeam} />
        )}
        {tab === "jugadores" && <Jugadores teams={teams} regs={regs} manager={manager} />}
        {tab === "calendario" && <Calendario tid={id} venue={t.venue} manager={manager} />}
        {tab === "jornadas" && <Jornadas tid={id} venue={t.venue} manager={manager} />}
      </main>

      <Sheet open={!!team} onOpenChange={(v) => !v && setOpenTeam(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl sm:mx-auto sm:max-w-2xl">
          {team && <TeamSheet team={team} regs={regs.filter((r) => r.team_id === team.id)} manager={manager} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const money = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function Resumen({
  t,
  teams,
  regs,
  manager,
  isMaster,
}: {
  t: NonNullable<ReturnType<typeof useTournament>["data"]>;
  teams: Team[];
  regs: Registration[];
  manager: boolean;
  isMaster: boolean;
}) {
  const stats = [
    { label: "Equipos", value: teams.length },
    { label: "Jugadores", value: regs.length },
    { label: "Aprobados", value: regs.filter((r) => r.status === "aprobado").length },
    { label: "Por revisar", value: regs.filter((r) => r.status === "pendiente").length },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="font-display text-3xl font-extrabold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-card sm:grid-cols-2">
        <Info label="Fecha de inicio" value={t.start_date ? new Date(`${t.start_date}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" }) : "—"} />
        <Info label="Sede" value={t.venue ?? "—"} />
        <Info label="Inscripción por equipo" value={money(t.registration_fee)} />
        <Info label="Arbitraje por partido" value={money(t.referee_fee)} />
      </div>
      {manager && <LeagueAdmins tournamentId={t.id} canEdit={isMaster} />}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function LeagueAdmins({ tournamentId, canEdit }: { tournamentId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const { data = [] } = useLeagueAdmins(tournamentId, true);
  const [u, setU] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["tournament_admins", tournamentId] });

  async function add() {
    setBusy(true);
    try {
      const p = await findProfileByUsername(u);
      if (!p) throw new Error("No existe esa cuenta");
      const { error } = await supabase.from("tournament_admins").insert({ tournament_id: tournamentId, user_id: p.id });
      if (error) throw new Error(error.code === "23505" ? "Ya es administrador de este torneo" : error.message);
      toast.success(`@${p.username} ahora administra el torneo`);
      setU("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-lg font-extrabold">Administradores de liga</h2>
      <p className="text-xs text-muted-foreground">Administran solo este torneo. Usan su cuenta existente.</p>
      <ul className="mt-3 space-y-2">
        {data.length === 0 && <li className="text-sm text-muted-foreground">Solo el Master administra este torneo.</li>}
        {data.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
            <span className="truncate font-semibold">{a.profile?.display_name ?? "Cuenta"} <span className="font-normal text-muted-foreground">@{a.profile?.username}</span></span>
            {canEdit && (
              <ConfirmButton
                title="Quitar administrador"
                description="Perderá el acceso a este torneo."
                confirmLabel="Quitar"
                onConfirm={async () => {
                  const { error } = await supabase.from("tournament_admins").delete().eq("id", a.id);
                  if (error) return void toast.error(error.message);
                  toast.success("Administrador quitado");
                  refresh();
                }}
              >
                <Button size="icon" variant="ghost" aria-label="Quitar"><X className="h-4 w-4" /></Button>
              </ConfirmButton>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="mt-3 flex gap-2">
          <Input value={u} onChange={(e) => setU(e.target.value)} placeholder="usuario" autoCapitalize="none" maxLength={40} />
          <Button disabled={busy || !u.trim()} onClick={add}><Plus className="mr-1 h-4 w-4" /> Agregar</Button>
        </div>
      )}
    </section>
  );
}

function TeamLogo({ path, className }: { path: string | null; className?: string }) {
  const url = useTeamFile(path);
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary", className)}>
      {url ? <img src={url} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Shield className="h-1/2 w-1/2 text-muted-foreground" />}
    </div>
  );
}

function Equipos({
  tournamentId,
  teams,
  regs,
  manager,
  onOpen,
}: {
  tournamentId: string;
  teams: Team[];
  regs: Registration[];
  manager: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold">{manager ? "Equipos" : "Mi equipo"}</h2>
        {manager && (
          <TeamFormDialog tournamentId={tournamentId}>
            <Button><Plus className="mr-1 h-4 w-4" /> Agregar equipo</Button>
          </TeamFormDialog>
        )}
      </div>
      {teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-display font-bold">Aún no hay equipos registrados.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((tm) => {
            const n = regs.filter((r) => r.team_id === tm.id).length;
            return (
              <button
                key={tm.id}
                type="button"
                onClick={() => onOpen(tm.id)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary"
              >
                <TeamLogo path={tm.logo_url} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-extrabold">{tm.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{tm.rep_name ?? "Sin representante"} · {n} jugadores</p>
                  <div className="mt-1.5"><Badge status={tm.status} label={TEAM_STATUS[tm.status]} /></div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function TeamSheet({ team, regs, manager }: { team: Team; regs: Registration[]; manager: boolean }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const isRep = team.rep_user_id === profile?.id;
  const [repUser, setRepUser] = useState<string | null>(null);

  useEffect(() => {
    if (!team.rep_user_id) return void setRepUser(null);
    void supabase.from("profiles").select("username").eq("id", team.rep_user_id).maybeSingle().then(({ data }) => setRepUser(data?.username ?? null));
  }, [team.rep_user_id]);

  return (
    <>
      <SheetHeader className="text-left">
        <div className="flex items-center gap-3">
          <TeamLogo path={team.logo_url} className="h-16 w-16" />
          <div className="min-w-0">
            <SheetTitle className="font-display text-xl font-extrabold">{team.name}</SheetTitle>
            <Badge status={team.status} label={TEAM_STATUS[team.status]} />
          </div>
        </div>
      </SheetHeader>
      <div className="mt-4 rounded-xl bg-secondary p-3 text-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Representante de equipo</p>
        <p className="font-semibold">{team.rep_name ?? "—"}</p>
        <p className="text-muted-foreground">{[team.rep_phone, team.rep_email].filter(Boolean).join(" · ") || "Sin contacto"}</p>
        {repUser && <p className="text-xs text-muted-foreground">Acceso: @{repUser}</p>}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">
        {(manager || isRep) && (
          <PlayerFormDialog teamId={team.id}>
            <Button className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" /> Registrar jugador</Button>
          </PlayerFormDialog>
        )}
        {manager && (
          <TeamFormDialog tournamentId={team.tournament_id} team={team} repUsername={repUser}>
            <Button variant="outline" className="w-full sm:w-auto"><Pencil className="mr-1 h-4 w-4" /> Editar equipo</Button>
          </TeamFormDialog>
        )}
        {manager && (
          <ConfirmButton
            title="Eliminar equipo"
            description="Se eliminará el equipo y sus inscripciones en este torneo."
            onConfirm={async () => {
              const { error } = await supabase.from("tournament_teams").delete().eq("id", team.id);
              if (error) return void toast.error(error.message);
              toast.success("Equipo eliminado");
              qc.invalidateQueries({ queryKey: ["tournament_teams", team.tournament_id] });
            }}
          >
            <Button variant="ghost" className="w-full text-destructive sm:w-auto"><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
          </ConfirmButton>
        )}
      </div>
      <h3 className="mt-6 font-display font-extrabold">Plantilla ({regs.length})</h3>
      <div className="mt-2 space-y-2 pb-6">
        {regs.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay jugadores registrados.</p>}
        {regs.map((r) => (
          <PlayerRow key={r.id} r={r} manager={manager} canDelete={manager || (isRep && r.status === "pendiente")} />
        ))}
      </div>
    </>
  );
}

function PlayerRow({ r, manager, canDelete, teamName }: { r: Registration; manager: boolean; canDelete: boolean; teamName?: string | undefined }) {
  const qc = useQueryClient();
  const photo = useTeamFile(r.photo_url);
  const [busy, setBusy] = useState(false);

  async function setStatus(status: RegStatus) {
    setBusy(true);
    const { error } = await supabase.from("team_registrations").update({ status }).eq("id", r.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(`Jugador ${REG_STATUS[status].toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["team_registrations"] });
  }

  async function openDoc() {
    if (!r.document_url) return;
    const url = await signedTeamFile(r.document_url);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("No se pudo abrir el documento");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-display font-extrabold">
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" /> : (r.jersey_number ?? "—")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{r.person?.full_name ?? "Jugador"}{r.jersey_number != null && <span className="text-muted-foreground"> · #{r.jersey_number}</span>}</p>
          <p className="truncate text-xs text-muted-foreground">
            {teamName ? `${teamName} · ` : ""}ID: {r.person?.document_number ?? "—"}
          </p>
        </div>
        <Badge status={r.status} label={REG_STATUS[r.status]} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {r.document_url && (
          <Button size="sm" variant="outline" onClick={openDoc}><FileText className="mr-1 h-4 w-4" /> Documento</Button>
        )}
        {manager && r.status !== "aprobado" && (
          <Button size="sm" disabled={busy} onClick={() => setStatus("aprobado")}><Check className="mr-1 h-4 w-4" /> Aprobar</Button>
        )}
        {manager && r.status !== "rechazado" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("rechazado")}><X className="mr-1 h-4 w-4" /> Rechazar</Button>
        )}
        {manager && r.status === "aprobado" && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("inactivo")}>Marcar inactivo</Button>
        )}
        {canDelete && (
          <ConfirmButton
            title="Quitar jugador"
            description="Se eliminará su inscripción en este equipo."
            confirmLabel="Quitar"
            onConfirm={async () => {
              const { error } = await supabase.from("team_registrations").delete().eq("id", r.id);
              if (error) return void toast.error(error.message);
              toast.success("Inscripción eliminada");
              qc.invalidateQueries({ queryKey: ["team_registrations"] });
            }}
          >
            <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}

function Jugadores({ teams, regs, manager }: { teams: Team[]; regs: Registration[]; manager: boolean }) {
  const [filter, setFilter] = useState<RegStatus | "todos">("pendiente");
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const list = filter === "todos" ? regs : regs.filter((r) => r.status === filter);
  const opts: (RegStatus | "todos")[] = ["pendiente", "aprobado", "rechazado", "inactivo", "todos"];
  return (
    <>
      <h2 className="mb-3 font-display text-xl font-extrabold">Jugadores</h2>
      <div className="mb-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setFilter(o)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs font-bold uppercase tracking-wide",
              filter === o ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {o === "todos" ? "Todos" : REG_STATUS[o]} ({o === "todos" ? regs.length : regs.filter((r) => r.status === o).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          No hay jugadores en este estado.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((r) => (
            <PlayerRow key={r.id} r={r} manager={manager} canDelete={manager} teamName={names.get(r.team_id)} />
          ))}
        </div>
      )}
    </>
  );
}
