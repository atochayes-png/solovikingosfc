import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
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
import {
  TEAM_STATUS,
  findProfileByUsername,
  uploadTeamFile,
  type Team,
  type TeamStatus,
} from "@/lib/tournaments";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del equipo").max(80),
  rep_name: z.string().trim().max(100),
  rep_phone: z.string().trim().max(30).regex(/^[0-9+\-\s()]*$/, "Teléfono no válido"),
  rep_email: z.union([z.literal(""), z.string().trim().email("Correo no válido").max(255)]),
  rep_username: z.string().trim().max(40),
  status: z.enum(["pendiente", "activo", "inactivo"]),
});

export function TeamFormDialog({
  tournamentId,
  team,
  repUsername,
  children,
}: {
  tournamentId: string;
  team?: Team;
  repUsername?: string | null;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const init = () => ({
    name: team?.name ?? "",
    rep_name: team?.rep_name ?? "",
    rep_phone: team?.rep_phone ?? "",
    rep_email: team?.rep_email ?? "",
    rep_username: repUsername ?? "",
    status: (team?.status ?? "pendiente") as TeamStatus,
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
    const v = parsed.data;
    setBusy(true);
    try {
      let rep_user_id: string | null = null;
      if (v.rep_username) {
        const p = await findProfileByUsername(v.rep_username);
        if (!p) throw new Error(`No existe la cuenta @${v.rep_username}`);
        rep_user_id = p.id;
      }
      const row = {
        name: v.name,
        rep_name: v.rep_name || null,
        rep_phone: v.rep_phone || null,
        rep_email: v.rep_email || null,
        rep_user_id,
        status: v.status,
      };
      let id = team?.id;
      if (team) {
        const { error } = await supabase.from("tournament_teams").update(row).eq("id", team.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("tournament_teams")
          .insert({ ...row, tournament_id: tournamentId })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }
      if (logo && id) {
        try {
          const path = await uploadTeamFile(id, logo, "escudo");
          await supabase.from("tournament_teams").update({ logo_url: path }).eq("id", id);
        } catch (e) {
          toast.error(`Equipo guardado, pero el escudo no se subió: ${e instanceof Error ? e.message : ""}`);
        }
      }
      toast.success(team ? "Equipo actualizado" : "Equipo agregado");
      qc.invalidateQueries({ queryKey: ["tournament_teams", tournamentId] });
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
        if (v) {
          setF(init());
          setLogo(null);
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team ? "Editar equipo" : "Agregar equipo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nombre del equipo">
            <Input value={f.name} onChange={set("name")} maxLength={80} />
          </Field>
          <Field label="Escudo / logotipo" hint="Opcional · imagen hasta 8 MB">
            <Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
          </Field>
          <div className="rounded-xl border border-border p-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Representante de equipo</p>
            <Field label="Nombre">
              <Input value={f.rep_name} onChange={set("rep_name")} maxLength={100} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono">
                <Input type="tel" inputMode="tel" value={f.rep_phone} onChange={set("rep_phone")} maxLength={30} />
              </Field>
              <Field label="Correo">
                <Input type="email" value={f.rep_email} onChange={set("rep_email")} maxLength={255} />
              </Field>
            </div>
            <Field label="Usuario con acceso" hint="Opcional. Usuario de una cuenta ya existente; podrá administrar solo este equipo.">
              <Input value={f.rep_username} onChange={set("rep_username")} placeholder="usuario" maxLength={40} autoCapitalize="none" />
            </Field>
          </div>
          <Field label="Estado">
            <select
              value={f.status}
              onChange={set("status")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(TEAM_STATUS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={busy} onClick={save}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {team ? "Guardar cambios" : "Agregar equipo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
