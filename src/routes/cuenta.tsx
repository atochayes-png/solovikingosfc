import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/admin.functions";

export const Route = createFileRoute("/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta — Vikingos FC" },
      { name: "description", content: "Gestiona tu contraseña y tus datos en Vikingos FC." },
      { property: "og:title", content: "Mi cuenta — Vikingos FC" },
      { property: "og:description", content: "Área personal del miembro del club." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cuenta,
});

function Cuenta() {
  const { profile, role, session } = useAuth();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    if (pass !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
    setBusy(true);
    try {
      await changeOwnPassword({ data: { password: pass } });
      setPass("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  }

  if (!session)
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState
            title="Necesitas iniciar sesión."
            action={
              <Button asChild>
                <Link to="/acceso">Ir al acceso</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader eyebrow="Área personal" title="Mi cuenta" />
      <div className="space-y-4 px-4 pb-6 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="eyebrow text-muted-foreground">Datos de acceso</p>
          <p className="mt-2 font-display text-xl font-extrabold">{profile?.display_name}</p>
          <p className="text-sm text-muted-foreground">
            Usuario: @{profile?.username} · Rol: {role}
          </p>
        </section>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <p className="eyebrow text-muted-foreground">Cambiar contraseña</p>
          <div className="space-y-1.5">
            <Label htmlFor="np">Nueva contraseña</Label>
            <Input
              id="np"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="new-password"
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">Confirmar contraseña</Label>
            <Input
              id="cp"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="h-12"
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar contraseña
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
