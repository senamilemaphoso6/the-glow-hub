import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/post-card";
import { TypeFilter } from "@/components/type-filter";
import { SearchBar } from "@/components/search-bar";
import { TrendingSidebar } from "@/components/trending-sidebar";
import { Button } from "@/components/ui/button";
import type { ContentType, Post, Profile } from "@/lib/types";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Glow Hub — A self-care community for women" },
      { name: "description", content: "Discover and share self-care blogs, skincare recipes, wellness routines and quick tips." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [type, setType] = useState<ContentType | "all">("all");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const postsQuery = useQuery({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as Post[];
    },
  });

  const authorIds = useMemo(
    () => Array.from(new Set((postsQuery.data ?? []).map((p) => p.author_id))),
    [postsQuery.data]
  );

  const profilesQuery = useQuery({
    queryKey: ["feed-profiles", authorIds],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", authorIds);
      if (error) throw error;
      return data as Pick<Profile, "id" | "display_name">[];
    },
  });
  const profileMap = useMemo(() => {
    const m = new Map<string, { display_name: string }>();
    (profilesQuery.data ?? []).forEach((p) => m.set(p.id, { display_name: p.display_name }));
    return m;
  }, [profilesQuery.data]);

  const filtered = useMemo(() => {
    let list = postsQuery.data ?? [];
    if (type !== "all") list = list.filter((p) => p.content_type === type);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          (p.excerpt ?? "").toLowerCase().includes(needle) ||
          p.body.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.includes(needle))
      );
    }
    return list;
  }, [postsQuery.data, type, q, tag]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    (postsQuery.data ?? []).forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [postsQuery.data]);

  return (
    <div>
      {/* Hero */}
      <section className="glow-gradient border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 chip chip-forest mb-5">
            <Sparkles className="h-3 w-3" /> A community for self-care
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-balance">
            Where women share <em className="text-primary not-italic">the rituals</em><br className="hidden sm:block" /> that bring them home to themselves.
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-base text-foreground/70">
            Read, write, and brew your own routines. Blogs, skincare recipes, wellness rituals and tiny tips — all in one warm place.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/create/$type" params={{ type: "blog" }}>Share something</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-6">
              <a href="#feed">Browse the feed</a>
            </Button>
          </div>
        </div>
      </section>

      <div id="feed" className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <SearchBar value={q} onChange={setQ} />
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
              <TypeFilter value={type} onChange={setType} />
              {tag && (
                <button onClick={() => setTag(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Clear tag #{tag}
                </button>
              )}
            </div>

            {postsQuery.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glow-card h-48 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glow-card p-10 text-center">
                <h3 className="font-display text-lg font-semibold">Nothing here yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Be the first to share — your story might be exactly what someone needs today.</p>
                <Button asChild className="mt-5 rounded-full">
                  <Link to="/create/$type" params={{ type: "blog" }}>Create the first post</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((p) => (
                  <PostCard key={p.id} post={p} author={profileMap.get(p.author_id)} />
                ))}
              </div>
            )}
          </div>

          <TrendingSidebar tags={trendingTags} onTagClick={setTag} />
        </div>
      </div>
    </div>
  );
}
