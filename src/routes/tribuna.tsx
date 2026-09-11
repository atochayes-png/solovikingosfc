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
  parent_id: string | null;
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
  const { session, isStaff } = useAuth();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const uid = session?.user.id;

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
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: session!.user.id,
        content: text.trim(),
        parent_id: replyTo?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["comment-counts"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo comentar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("comments").delete().eq("parent_id", id);
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentario eliminado");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["comment-counts"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar"),
  });

  const roots = comments.filter((c) => !c.parent_id);

  function renderComment(c: CommentRow, nested = false) {
    return (
      <li key={c.id} className={cn("text-sm", nested && "ml-6 border-l border-border pl-3")}>
        <div className="flex items-start gap-2">
          <p className="flex-1">
            <span className="font-semibold">{c.profiles?.display_name ?? "Vikingo"}: </span>
            <span className="text-muted-foreground">{c.content}</span>
          </p>
          {(isStaff || c.author_id === uid) && (
            <button
              type="button"
              aria-label="Eliminar comentario"
              className="text-muted-foreground hover:text-destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(c.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {!nested && (
          <button
            type="button"
            className="mt-0.5 text-xs font-semibold text-primary"
            onClick={() => setReplyTo(c)}
          >
            Responder
          </button>
        )}
        {!nested && (
          <ul className="mt-2 space-y-2">
            {comments.filter((r) => r.parent_id === c.id).map((r) => renderComment(r, true))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {roots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
      ) : (
        <ul className="space-y-2">{roots.map((c) => renderComment(c))}</ul>
      )}
      {replyTo && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          Respondiendo a {replyTo.profiles?.display_name ?? "Vikingo"}
          <button
            type="button"
            className="font-semibold text-primary"
            onClick={() => setReplyTo(null)}
          >
            Cancelar
          </button>
        </p>
      )}
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
          placeholder={replyTo ? "Escribe tu respuesta" : "Escribe un comentario"}
          className="h-10"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Enviar comentario"
          disabled={add.isPending || !text.trim()}
        >
          {add.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function PostCard({
  post,
  reactions,
  commentCount,
}: {
  post: PostRow;
  reactions: ReactionRow[];
  commentCount: number;
}) {
  const qc = useQueryClient();
  const { session, isStaff } = useAuth();
  const [openComments, setOpenComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const uid = session?.user.id;
  const canDelete = isStaff || post.author_id === uid;
  const canEdit = post.author_id === uid;

  async function react(emoji: string) {
    if (!uid || reacting) return;
    setReacting(emoji);
    const mine = reactions.find((r) => r.user_id === uid && r.emoji === emoji);
    const { error } = mine
      ? await supabase.from("reactions").delete().eq("id", mine.id)
      : await supabase.from("reactions").insert({ post_id: post.id, user_id: uid, emoji });
    setReacting(null);
    if (error) { toast.error("No se pudo registrar tu reacción"); return; }
    qc.invalidateQueries({ queryKey: ["reactions"] });
  }

  async function saveEdit() {
    if (!draft.trim() && !post.media_url) {
      toast.error("La publicación no puede quedar vacía");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("posts")
      .update({ content: draft.trim() })
      .eq("id", post.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Publicación actualizada");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["posts"] });
  }

  async function remove() {
    setRemoving(true);
    await supabase.from("reactions").delete().eq("post_id", post.id);
    await supabase.from("comments").delete().eq("post_id", post.id);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    setRemoving(false);
    if (error) toast.error("No se pudo eliminar");
    else {
      toast.success("Publicación eliminada");
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["comment-counts"] });
      qc.invalidateQueries({ queryKey: ["reactions"] });
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
        {canEdit && !editing && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Editar publicación"
            onClick={() => {
              setDraft(post.content);
              setEditing(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        {canDelete && (
          <ConfirmButton
            title="¿Eliminar esta publicación?"
            description="También se borrarán sus comentarios y reacciones."
            onConfirm={remove}
          >
            <Button
              size="icon"
              variant="ghost"
              aria-label="Eliminar publicación"
              disabled={removing}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </ConfirmButton>
        )}
      </header>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        post.content && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
        )
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
              disabled={reacting === emoji}
              className={cn(
                "rounded-full border px-2.5 py-1 text-sm transition-colors disabled:opacity-60",
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
