import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  MessagesSquare,
  CalendarDays,
  Users,
  BarChart3,
  ListOrdered,
  Images,
  Shield,
  LogIn,
  LogOut,
  Settings,
  Menu,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/vk/notifications";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SiteImage } from "@/components/vk/site-image";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/tribuna", label: "Tribuna", icon: MessagesSquare },
  { to: "/partidos", label: "Partidos", icon: CalendarDays },
  { to: "/plantilla", label: "Plantilla", icon: Users },
  { to: "/tabla", label: "Tabla", icon: ListOrdered },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/vikingoteca", label: "Vikingoteca", icon: Images },
  { to: "/club", label: "El Club", icon: Shield },
] as const;

const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[4]] as const;

export function Crest({ className }: { className?: string }) {
  return (
    <SiteImage
      imageKey="club_logo"
      fallbackSrc={BRAND.crest}
      alt="Escudo oficial de Vikingos FC"
      className={cn("object-contain", className)}
    />
  );
}

function useActive() {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useActive();
  const { role, profile, isStaff, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const panelLink = isStaff ? "/panel" : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Crest className="h-10 w-10" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-extrabold tracking-tight">
                VIKINGOS FC
              </span>
              <span className="eyebrow text-[9px] text-muted-foreground">Fundado 2017</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  pathname === item.to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            {panelLink && (
              <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
                <Link to={panelLink}>
                  <Settings className="mr-1 h-4 w-4" />
                  {role === "master" ? "Panel Master" : "Panel Admin"}
                </Link>
              </Button>
            )}
            {profile && <NotificationBell />}
            {profile ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Mi cuenta">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[85vw] sm:w-96">
                  <div className="mt-6 space-y-1 px-4">
                    <p className="eyebrow text-muted-foreground">Sesión iniciada</p>
                    <p className="font-display text-xl font-bold">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{profile.username} · {role}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-1 px-2">
                    {NAV.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ))}
                    {role === "master" && (
                      <Link
                        to="/master"
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2.5 text-sm font-bold text-primary hover:bg-secondary"
                      >
                        Panel Master · Gestión Deportiva
                      </Link>
                    )}
                    <Link
                      to="/torneos"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                    >
                      Torneos
                    </Link>
                    {panelLink && (
                      <Link
                        to={panelLink}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                      >
                        {role === "master" ? "Panel Master" : "Panel Administrador"}
                      </Link>
                    )}
                    <Link
                      to="/cuenta"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                    >
                      Mi cuenta
                    </Link>
                  </div>
                  <div className="mt-6 px-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setOpen(false);
                        await signOut();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/acceso">
                  <LogIn className="mr-1 h-4 w-4" /> Acceso
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 pb-24 lg:pb-12">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 sm:px-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-accent-foreground/70">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-4 rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center sm:mx-6">
      <Crest className="mx-auto h-12 w-12 opacity-25" />
      <p className="mt-4 font-display text-base font-bold">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
