import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "vikingos";
const cache = new Map<string, { url: string; exp: number }>();

export function isExternal(path?: string | null) {
  return !!path && (path.startsWith("http") || path.startsWith("/"));
}

export async function resolveMedia(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (isExternal(path)) return path;
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export function useMedia(path?: string | null) {
  const [url, setUrl] = useState<string | null>(isExternal(path) ? (path as string) : null);
  useEffect(() => {
    let on = true;
    resolveMedia(path).then((u) => on && setUrl(u));
    return () => {
      on = false;
    };
  }, [path]);
  return url;
}

export const MAX_IMAGE_MB = 8;
export const MAX_VIDEO_MB = 45;

export async function uploadFile(
  file: File,
  folder: string,
): Promise<{ path: string; type: "image" | "video" }> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Solo se admiten imágenes o videos");
  const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > limit * 1024 * 1024)
    throw new Error(`El archivo supera ${limit} MB. Usa una versión más ligera.`);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, type: isVideo ? "video" : "image" };
}
