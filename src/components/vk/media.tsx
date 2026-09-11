import { useMedia } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export function StorageImage({
  path,
  alt,
  className,
  fallback,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const url = useMedia(path);
  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary", className)}>
        {fallback ?? <User className="h-1/3 w-1/3 text-muted-foreground/50" />}
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

export function StorageMedia({
  path,
  type,
  alt,
  className,
  contain,
}: {
  path?: string | null;
  type?: string | null;
  alt: string;
  className?: string;
  contain?: boolean;
}) {
  const url = useMedia(path);
  if (!url) return null;
  if (type === "video") {
    return <video src={url} controls playsInline className={cn("w-full bg-black", className)} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn(contain ? "object-contain" : "object-cover", className)}
    />
  );
}
