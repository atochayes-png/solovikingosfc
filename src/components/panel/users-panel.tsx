import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/queries";
import {
  createAdminUser,
  createVikingoUser,
  resetUserPassword,
  setAccountActive,
  updateAccount,
} from "@/lib/admin.functions";

type Account = {
  id: string;
  username: string;
  display_name: string;
  active: boolean;
  role: string;
};

function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name, active").order("username"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "vikingo",
      })) as Account[];
    },
  });
}

export function UsersPanel() {
  const qc = useQueryClient();
  const { isMaster } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const { data: players = [] } = usePlayers();

  const [adminName, setAdminName] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [vkName, setVkName] = useState("");
  const [vkUser, setVkUser] = useState("");
  const [vkPlayer, setVkPlayer] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<string>("");
  const [resetPass, setResetPass] = useState("");
  const [resetting, setResetting] = useState(false);
  const [edit, setEdit] = useState<{ id: string; name: string; role: "admin" | "vikingo" } | null>(
    null,
  );
  const [savingEdit, setSavingEdit] = useState(false);

  async function saveEdit() {
    if (!edit) return;
    if (edit.name.trim().length < 2) { toast.error("Escribe el nombre completo"); return; }
    setSavingEdit(true);
    try {
      await updateAccount({
        data: { userId: edit.id, displayName: edit.name.trim(), role: edit.role },
      });
      toast.success("Cuenta actualizada");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setSavingEdit(false);
    }
  }

  async function addAdmin() {
    setBusy(true);
    try {
      await createAdminUser({
        data: { displayName: adminName, username: adminUser, password: adminPass },
      });
      toast.success("Administrador creado");
      setAdminName("");
      setAdminUser("");
      setAdminPass("");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  async function addVikingo() {
    setBusy(true);
    try {
      await createVikingoUser({
        data: {
          displayName: vkName,
          username: vkUser,
          ...(vkPlayer ? { playerId: vkPlayer } : {}),
        },
      });
      toast.success('Vikingo creado con contraseña inicial "Vikingos"');
      setVkName("");
      setVkUser("");
      setVkPlayer("");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["players"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    if (!resetFor || resetPass.length < 4) { toast.error("Escribe la nueva contraseña"); return; }
    setResetting(true);
    try {
      await resetUserPassword({ data: { userId: resetFor, password: resetPass } });
      toast.success("Contraseña restablecida");
      setResetFor("");
      setResetPass("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo restablecer");
    } finally {
      setResetting(false);
    }
  }

  async function toggleActive(userId: string, active: boolean) {
    try {
      await setAccountActive({ data: { userId, active } });
      toast.success(active ? "Cuenta activada" : "Cuenta desactivada");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  }

  return (
    <>
      {isMaster && (
        <PanelCard title="Nuevo administrador">
          <Field label="Nombre">
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          </Field>
          <Field label="Usuario">
            <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} />
          </Field>
          <Field
            label="Contraseña inicial"
            hint="Debe ser el nombre con mayúscula inicial más al menos un número. Ejemplo: Carlos1"
          >
            <Input value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
          </Field>
          <Button className="w-full" onClick={addAdmin} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear administrador
          </Button>
        </PanelCard>
      )}

      <PanelCard title="Nuevo Vikingo">
        <Field label="Nombre">
          <Input value={vkName} onChange={(e) => setVkName(e.target.value)} />
        </Field>
        <Field label="Usuario" hint='La contraseña inicial siempre es "Vikingos".'>
          <Input value={vkUser} onChange={(e) => setVkUser(e.target.value)} />
        </Field>
        <Field label="Jugador vinculado">
          <Select value={vkPlayer} onValueChange={setVkPlayer}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button className="w-full" onClick={addVikingo} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear cuenta de Vikingo
        </Button>
      </PanelCard>

      <PanelCard title="Cuentas del club">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  @{a.username} · {a.role}
                </p>
              </div>
              {isMaster && a.role !== "master" && (
                <>
                  <Switch
                    checked={a.active}
                    onCheckedChange={(v) => toggleActive(a.id, v)}
                    aria-label="Cuenta activa"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar cuenta"
                    onClick={() =>
                      setEdit({
                        id: a.id,
                        name: a.display_name,
                        role: a.role === "admin" ? "admin" : "vikingo",
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setResetFor(resetFor === a.id ? "" : a.id)}
                  >
                    Contraseña
                  </Button>
                </>
              )}
              {resetFor === a.id && (
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Nueva contraseña"
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                  />
                  <Button onClick={doReset} disabled={resetting}>
                    {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar cuenta</DialogTitle>
            </DialogHeader>
            {edit && (
              <div className="space-y-3">
                <Field label="Nombre">
                  <Input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </Field>
                <Field label="Rol">
                  <Select
                    value={edit.role}
                    onValueChange={(v) => setEdit({ ...edit, role: v as "admin" | "vikingo" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="vikingo">Vikingo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button className="w-full" onClick={saveEdit} disabled={savingEdit}>
                  {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PanelCard>
    </>
  );
}
