import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { typeMeta, type Post, type Profile } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$id")({
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const q = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
  });

  const author = useQuery({
    queryKey: ["author", q.data?.author_id],
    enabled: !!q.data?.author_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", q.data!.author_id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-16"><div className="glow-card h-72 animate-pulse" /></div>;
  if (!q.data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-muted-foreground">Post not found.</p></div>;

  const post = q.data;
  const meta = typeMeta(post.content_type);
  const data = post.data as {
    ingredients?: string[];
    steps?: { title: string; detail: string; duration_min?: number }[];
    tip?: string;
    time_total_min?: number;
  };

  async function del() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    nav({ to: "/dashboard" });
  }

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <span className="chip chip-primary"><span>{meta.emoji}</span> {meta.label}</span>
        {data.time_total_min && (
          <span className="chip chip-forest"><Clock className="h-3 w-3" /> {data.time_total_min} min</span>
        )}
      </div>

      <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight text-balance">{post.title}</h1>
      {post.excerpt && <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>}

      <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
        <span>by <span className="font-medium text-foreground">{author.data?.display_name ?? "A Glow Member"}</span> · {new Date(post.created_at).toLocaleDateString()}</span>
        {user?.id === post.author_id && (
          <Button variant="ghost" size="sm" onClick={del} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </div>

      {/* Tip */}
      {post.content_type === "tip" && data.tip && (
        <div className="mt-8 glow-card p-6 sm:p-8 text-center">
          <p className="font-display text-xl sm:text-2xl text-balance">{data.tip}</p>
        </div>
      )}

      {/* Recipe ingredients */}
      {post.content_type === "recipe" && data.ingredients && data.ingredients.length > 0 && (
        <section className="mt-8 glow-card p-6">
          <h2 className="font-display text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-1.5 text-sm">
            {data.ingredients.map((i, idx) => (
              <li key={idx} className="flex gap-2"><span className="text-primary">•</span> {i}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps for recipe/routine */}
      {(post.content_type === "recipe" || post.content_type === "routine") && data.steps && data.steps.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold mb-4">Steps</h2>
          <ol className="space-y-3">
            {data.steps.map((s, i) => (
              <li key={i} className="glow-card p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl text-primary font-semibold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{s.title}</h3>
                      {s.duration_min && <span className="text-xs text-muted-foreground">{s.duration_min} min</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Body */}
      {post.body && (
        <div className="mt-8 prose prose-stone max-w-none">
          <div className="font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.body}</div>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          {post.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
        </div>
      )}
    </article>
  );
}
