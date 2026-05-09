import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPES, type Post } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · The Glow Hub" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const myPosts = useQuery({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts").select("*").eq("author_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your space</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">My posts</h1>
        </div>
        <div className="flex gap-2">
          {CONTENT_TYPES.map((c) => (
            <Button key={c.value} asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/create/$type" params={{ type: c.value }}>+ {c.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {myPosts.isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (<div key={i} className="glow-card h-48 animate-pulse" />))}
        </div>
      ) : (myPosts.data ?? []).length === 0 ? (
        <div className="glow-card p-10 text-center">
          <h3 className="font-display text-lg font-semibold">Your first post is waiting</h3>
          <p className="mt-2 text-sm text-muted-foreground">Pick a content type above to begin.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {myPosts.data!.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
