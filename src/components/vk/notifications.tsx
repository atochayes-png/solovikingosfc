import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notif = {
  id: string;
  post_id: string;
  excerpt: string | null;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string } | null;
};

export function NotificationBell() {
  const { profile } = useAuth();
  const uid = profile?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const key = ["notifications", uid];

  const { data = [] } = useQuery({
    queryKey: key,
    enabled: !!uid,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, post_id, excerpt, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name)")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Notif[];
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, qc]);

  if (!uid) return null;
  const unread = data.filter((n) => !n.read_at).length;

  const open = async (n: Notif) => {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      qc.invalidateQueries({ queryKey: key });
    }
    navigate({ to: "/tribuna", hash: `post-${n.post_id}` });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={unread ? `Notificaciones (${unread} sin leer)` : "Notificaciones"} className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <p className="eyebrow border-b border-border px-4 py-3 text-muted-foreground">Notificaciones</p>
        {data.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No tienes notificaciones.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {data.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-secondary ${n.read_at ? "" : "bg-accent/10"}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-primary"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm">
                      <strong>{n.actor?.display_name ?? "Un vikingo"}</strong> publicó en La Tribuna
                    </span>
                    {n.excerpt && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.excerpt}</span>}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
