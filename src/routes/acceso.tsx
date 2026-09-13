import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crest } from "@/components/vk/shell";
import { useAuth } from "@/lib/auth";
import { bootstrapMaster } from "@/lib/admin.functions";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title: "Acceso — Vikingos FC" },
      {
        name: "description",
        content: "Inicia sesión con tu usuario y contraseña de Vikingos FC.",
      },
      { property: "og:title", content: "Acceso — Vikingos FC" },
      { property: "og:description", content: "Área privada de Vikingos FC." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const { signIn, role, session } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Crea la cuenta MASTER inicial la primera vez que se abre el acceso.
    bootstrapMaster().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session) return;
    if (role === "master" || role === "admin") navigate({ to: "/panel", replace: true });
    else if (role === "vikingo") navigate({ to: "/tribuna", replace: true });
  }, [session, role, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    try {
      await signIn(username, password);
      toast.success("Bienvenido, Vikingo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <img
        src={BRAND.pitch}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.22_0.08_262/0.9),oklch(0.16_0.06_262/0.97))]" />

      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <Crest className="mx-auto h-20 w-20" />
          <h1 className="mt-4 font-display text-2xl font-black text-white">VIKINGOS FC</h1>
          <p className="eyebrow mt-1 text-white/50">Acceso al club</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-xl bg-card p-5 shadow-lift"
          autoComplete="on"
        >
          <div className="space-y-1.5">
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="Tu usuario"
              className="h-12 text-base"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              className="h-12 text-base"
              required
            />
          </div>
          <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-semibold text-white/70 hover:text-white">
            Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
