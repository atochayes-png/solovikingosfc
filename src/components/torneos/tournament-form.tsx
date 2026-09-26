import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/panel/common";
import { TOURNAMENT_STATUS, type Tournament, type TournamentStatus } from "@/lib/tournaments";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del torneo").max(120),
  season: z.string().trim().max(60),
  category: z.string().trim().max(60),
  venue: z.string().trim().max(120),
  start_date: z.string(),
  status: z.enum(["preparacion", "activo", "finalizado"]),
  registration_fee: z.string(),
  referee_fee: z.string(),
});

const money = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error("Los costos deben ser números positivos");
  return n;
};

export function TournamentFormDialog({
  tournament,
  children,
}: {
  tournament?: Tournament;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const init = () => ({
    name: tournament?.name ?? "",
    season: tournament?.season ?? "",
    category: tournament?.category ?? "",
    venue: tournament?.venue ?? "",
    start_date: tournament?.start_date ?? "",
    status: (tournament?.status ?? "preparacion") as TournamentStatus,
    registration_fee: tournament?.registration_fee?.toString() ?? "",
    referee_fee: tournament?.referee_fee?.toString() ?? "",
  });
  const [f, setF] = useState(init);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    const parsed = schema.safeParse(f);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }
    setBusy(true);
    try {
      const v = parsed.data;
      const row = {
        name: v.name,
        season: v.season || null,
        category: v.category || null,
        venue: v.venue || null,
        start_date: v.start_date || null,
        status: v.status,
        registration_fee: money(v.registration_fee),
        referee_fee: money(v.referee_fee),
      };
      const { error } = tournament
        ? await supabase.from("tournaments").update(row).eq("id", tournament.id)
        : await supabase.from("tournaments").insert({ ...row, created_by: profile?.id ?? null });
      if (error) throw error;
      toast.success(tournament ? "Torneo actualizado" : "Torneo creado");
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      if (tournament) qc.invalidateQueries({ queryKey: ["tournament", tournament.id] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        if (v) setF(init());
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tournament ? "Editar torneo" : "Crear torneo de fútbol"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nombre del torneo">
            <Input value={f.name} onChange={set("name")} placeholder="Ej. Liga de Veteranos" maxLength={120} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Temporada / edición">
              <Input value={f.season} onChange={set("season")} placeholder="Ej. Apertura 2026" maxLength={60} />
            </Field>
            <Field label="Categoría">
              <Input value={f.category} onChange={set("category")} placeholder="Ej. Veteranos" maxLength={60} />
            </Field>
          </div>
          <Field label="Sede">
            <Input value={f.venue} onChange={set("venue")} placeholder="Ej. Parque de la López" maxLength={120} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de inicio">
              <Input type="date" value={f.start_date} onChange={set("start_date")} />
            </Field>
            <Field label="Estado">
              <select
                value={f.status}
                onChange={set("status")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(TOURNAMENT_STATUS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inscripción por equipo" hint="Opcional, solo informativo">
              <Input type="number" min={0} inputMode="decimal" value={f.registration_fee} onChange={set("registration_fee")} placeholder="$" />
            </Field>
            <Field label="Arbitraje por partido" hint="Opcional, solo informativo">
              <Input type="number" min={0} inputMode="decimal" value={f.referee_fee} onChange={set("referee_fee")} placeholder="$" />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">Deporte: Fútbol</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={busy} onClick={save}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tournament ? "Guardar cambios" : "Crear torneo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
