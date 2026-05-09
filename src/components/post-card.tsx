import { Link } from "@tanstack/react-router";
import type { Post } from "@/lib/types";
import { typeMeta } from "@/lib/types";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PostCard({ post, author }: { post: Post; author?: { display_name: string } | null }) {
  const meta = typeMeta(post.content_type);
  return (
    <Link
      to="/post/$id"
      params={{ id: post.id }}
      className="glow-card group block p-5 sm:p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={post.content_type === "tip" ? "chip chip-forest" : "chip chip-primary"}>
          <span>{meta.emoji}</span> {meta.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{formatDate(post.created_at)}</span>
      </div>
      <h3 className="font-display text-xl sm:text-[1.35rem] font-semibold leading-snug text-balance group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">by <span className="font-medium text-foreground/80">{author?.display_name ?? "A Glow Member"}</span></span>
        {post.tags.length > 0 && (
          <div className="flex gap-1.5 overflow-hidden">
            {post.tags.slice(0, 2).map((t) => (
              <span key={t} className="chip">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
