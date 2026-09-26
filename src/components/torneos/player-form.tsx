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
import { uploadTeamFile } from "@/lib/tournaments";

const schema = z.object({
  full_name: z.string().trim().min(3, "Escribe el nombre completo").max(120),
  document_number: z.string().trim().max(40),
  jersey: z.string().regex(/^\d{0,3}$/, "Dorsal no válido"),
});

export function PlayerFormDialog({ teamId, children }: { teamId: string; children: ReactNode }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ full_name: "", document_number: "", jersey: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);

  async function save() {
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const v = parsed.data;
    setBusy(true);
    try {
      const photo_url = photo ? await uploadTeamFile(teamId, photo, "fotos") : null;
      const document_url = doc ? await uploadTeamFile(teamId, doc, "documentos") : null;
      const { data: person, error: pe } = await supabase
        .from("sport_people")
        .insert({ full_name: v.full_name, document_number: v.document_number || null, created_by: profile?.id })
        .select("id")
        .single();
      if (pe) throw pe;
      const { error } = await supabase.from("team_registrations").insert({
        team_id: teamId,
        person_id: person.id,
        jersey_number: v.jersey ? Number(v.jersey) : null,
        photo_url,
        document_url,
        created_by: profile?.id,
      });
      if (error) {
        await supabase.from("sport_people").delete().eq("id", person.id);
        throw error;
      }
      toast.success("Jugador registrado · pendiente de aprobación");
      qc.invalidateQueries({ queryKey: ["team_registrations"] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar");
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
          setF({ full_name: "", document_number: "", jersey: "" });
          setPhoto(null);
          setDoc(null);
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar jugador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nombre completo">
            <Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={120} />
          </Field>
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <Field label="Identificación">
              <Input value={f.document_number} onChange={(e) => setF({ ...f, document_number: e.target.value })} placeholder="Núm. de documento" maxLength={40} />
            </Field>
            <Field label="Dorsal">
              <Input inputMode="numeric" value={f.jersey} onChange={(e) => setF({ ...f, jersey: e.target.value })} maxLength={3} />
            </Field>
          </div>
          <Field label="Documento de identificación" hint="Opcional · imagen o PDF hasta 8 MB. Solo lo ve la liga y tu equipo.">
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setDoc(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="Fotografía" hint="Opcional">
            <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={busy} onClick={save}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
