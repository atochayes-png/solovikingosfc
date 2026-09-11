import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ImagePlus, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/vk/shell";
import { StorageImage, StorageMedia } from "@/components/vk/media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { REACTIONS } from "@/lib/brand";
import { uploadFile } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tribuna")({
  head: () => ({
    meta: [
      { title: "La Tribuna Vikinga — Vikingos FC" },
      {
        name: "description",
        content:
          "El espacio social de Vikingos FC: publicaciones, fotos, comentarios y reacciones de la comunidad del club.",
      },
      { property: "og:title", content: "La Tribuna Vikinga — Vikingos FC" },
      { property: "og:description", content: "La conversación del vestidor de Vikingos FC." },
    ],
  }),
  component: Tribuna,
});

type PostRow = {
  id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null } | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

type ReactionRow = { id: string; post_id: string; user_id: string; emoji: string };

function useFeed() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles:author_id (username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as PostRow[];
    },
  });
}

function Composer() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function publish() {
    if (!content.trim() && !file) return;
    setBusy(true);
    try {
      let media_url: string | null = null;
      let media_type: string | null = null;
      if (file) {
        const up = await uploadFile(file, "tribuna");
        media_url = up.path;
        media_type = up.type;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: session!.user.id,
        content: content.trim(),
        media_url,
        media_type,
      });
      if (error) throw error;
      setContent("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Publicado en La Tribuna");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo publicar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué pasa en el vestidor?"
        rows={3}
        className="resize-none border-0 p-0 text-base shadow-none focus-visible:ring-0"
      />
      {file && <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="text-muted-foreground"
        >
          <ImagePlus className="mr-1.5 h-4 w-4" /> Foto o video
        </Button>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button size="sm" onClick={publish} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Publicar
        </Button>
      </div>
    </div>
  );
}

function Comments({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [text, setText] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:author_id (display_name)")
        .eq("post_id", postId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, author_id: session!.user.id, content: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: () => toast.error("No se pudo comentar"),
  });

  return (
    <div className="mt-3 border-t border-border pt-3">
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="text-sm">
            <span className="font-semibold">{c.profiles?.display_name ?? "Vikingo"}: </span>
            <span className="text-muted-foreground">{c.content}</span>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add.mutate();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario"
          className="h-10"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={add.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function PostCard({
  post,
  reactions,
}: {
  post: PostRow;
  reactions: ReactionRow[];
}) {
  const qc = useQueryClient();
  const { session, isStaff } = useAuth();
  const [openComments, setOpenComments] = useState(false);
  const uid = session?.user.id;
  const canDelete = isStaff || post.author_id === uid;

  async function react(emoji: string) {
    if (!uid) return;
    const mine = reactions.find((r) => r.user_id === uid && r.emoji === emoji);
    if (mine) await supabase.from("reactions").delete().eq("id", mine.id);
    else await supabase.from("reactions").insert({ post_id: post.id, user_id: uid, emoji });
    qc.invalidateQueries({ queryKey: ["reactions"] });
  }

  async function remove() {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error("No se pudo eliminar");
    else {
      toast.success("Publicación eliminada");
      qc.invalidateQueries({ queryKey: ["posts"] });
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-card">
      <header className="flex items-center gap-3">
        <StorageImage
          path={post.profiles?.avatar_url}
          alt={post.profiles?.display_name ?? "Vikingo"}
          className="h-10 w-10 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold">
            {post.profiles?.display_name ?? "Vikingo"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" onClick={remove} aria-label="Eliminar publicación">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </header>

      {post.content && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
      )}
      {post.media_url && (
        <StorageMedia
          path={post.media_url}
          type={post.media_type}
          alt="Contenido de la publicación"
          className="mt-3 max-h-[26rem] w-full rounded-lg"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((emoji) => {
          const count = reactions.filter((r) => r.emoji === emoji).length;
          const mine = reactions.some((r) => r.emoji === emoji && r.user_id === uid);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-sm transition-colors",
                mine ? "border-primary bg-primary/10" : "border-border hover:bg-secondary",
              )}
            >
              {emoji}
              {count > 0 && <span className="ml-1 text-xs font-bold tabular-nums">{count}</span>}
            </button>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={() => setOpenComments((v) => !v)}
        >
          <MessageCircle className="mr-1.5 h-4 w-4" /> Comentarios
        </Button>
      </div>

      {openComments && <Comments postId={post.id} />}
    </article>
  );
}

function Tribuna() {
  const { session, loading } = useAuth();
  const { data: posts = [], isLoading } = useFeed();
  const { data: reactions = [] } = useQuery({
    queryKey: ["reactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reactions").select("*");
      if (error) throw error;
      return (data ?? []) as ReactionRow[];
    },
    enabled: !!session,
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Comunidad"
        title="La Tribuna Vikinga"
        description="El espacio social del club: fotos, retas, memes y buena vibra."
      />
      <div className="space-y-4 px-4 pb-6 sm:px-6">
        {loading ? null : !session ? (
          <EmptyState
            title="La Tribuna es solo para miembros del club."
            hint="Inicia sesión con tu usuario de Vikingos FC para publicar, comentar y reaccionar."
            action={
              <Button asChild>
                <Link to="/acceso">Iniciar sesión</Link>
              </Button>
            }
          />
        ) : (
          <>
            <Composer />
            {isLoading ? null : posts.length === 0 ? (
              <EmptyState title="Todavía no hay publicaciones. Rompe el hielo." />
            ) : (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  reactions={reactions.filter((r) => r.post_id === p.id)}
                />
              ))
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
