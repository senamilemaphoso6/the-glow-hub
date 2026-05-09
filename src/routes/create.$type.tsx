import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { generateContent } from "@/lib/ai-generate.functions";
import { CONTENT_TYPES, type ContentType, typeMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/create/$type")({
  head: () => ({ meta: [{ title: "Create · The Glow Hub" }] }),
  component: CreatePage,
});

interface FormState {
  topic: string;
  notes: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  ingredients: string;
  steps: { title: string; detail: string; duration_min?: number }[];
  tip: string;
  time_total_min?: number;
}

const empty: FormState = {
  topic: "", notes: "", title: "", excerpt: "", body: "", tags: "",
  ingredients: "", steps: [], tip: "", time_total_min: undefined,
};

function CreatePage() {
  const { type } = Route.useParams();
  const ct = (CONTENT_TYPES.find((c) => c.value === type)?.value ?? "blog") as ContentType;
  const meta = typeMeta(ct);
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const generate = useServerFn(generateContent);
  const [form, setForm] = useState<FormState>(empty);
  const [busyAI, setBusyAI] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!form.topic.trim()) { toast.error("Add a topic first so AI knows what to write about"); return; }
    setBusyAI(true);
    try {
      const res = await generate({ data: { type: ct, topic: form.topic, notes: form.notes } });
      if (!res.ok) { toast.error(res.error); return; }
      const c = res.content;
      setForm((f) => ({
        ...f,
        title: c.title,
        excerpt: c.excerpt,
        body: c.body,
        tags: (c.tags ?? []).join(", "),
        ingredients: (c.data.ingredients ?? []).join("\n"),
        steps: c.data.steps ?? [],
        tip: c.data.tip ?? "",
        time_total_min: c.data.time_total_min,
      }));
      toast.success("AI wrote a draft — edit it to make it yours ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setBusyAI(false); }
  }

  async function handleSave() {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Add a title"); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      type Json = Parameters<typeof supabase.from>[0] extends never ? never : never;
      void (0 as unknown as Json);
      if (ct === "recipe") data.ingredients = form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
      if (ct === "recipe" || ct === "routine") data.steps = form.steps;
      if (ct === "routine" && form.time_total_min) data.time_total_min = form.time_total_min;
      if (ct === "tip") data.tip = form.tip || form.body;

      const tags = form.tags.split(",").map((t) => t.trim().toLowerCase().replace(/^#/, "")).filter(Boolean);

      const { data: inserted, error } = await supabase.from("posts").insert({
        author_id: user.id,
        content_type: ct,
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        body: form.body,
        data,
        tags,
        published: true,
      }).select("id").single();
      if (error) throw error;
      toast.success("Published 🌸");
      nav({ to: "/post/$id", params: { id: inserted.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {CONTENT_TYPES.map((c) => (
          <Link key={c.value} to="/create/$type" params={{ type: c.value }} className={c.value === ct ? "chip chip-primary" : "chip"}>
            <span>{c.emoji}</span> {c.label}
          </Link>
        ))}
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">New {meta.label.toLowerCase()}</h1>
      <p className="text-sm text-muted-foreground mt-1">{meta.blurb}</p>

      {/* AI block */}
      <section className="mt-7 glow-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">AI co-writer</h2>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic / prompt</Label>
            <Input id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder={ct === "recipe" ? "Honey + oat hydrating mask for dry winter skin" : ct === "routine" ? "Sunday slow-morning reset" : ct === "tip" ? "Calming the 3pm anxiety dip" : "Why journaling changed how I rest"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Optional notes for the AI</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Tone, audience, anything personal you want included…" />
          </div>
          <Button type="button" onClick={handleGenerate} disabled={busyAI} className="rounded-full">
            {busyAI ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</> : <><Sparkles className="h-4 w-4" /> Generate Content</>}
          </Button>
        </div>
      </section>

      {/* Editable post */}
      <section className="mt-6 glow-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="A one-line teaser" />
        </div>

        {ct === "recipe" && (
          <div className="space-y-1.5">
            <Label htmlFor="ingredients">Ingredients (one per line)</Label>
            <Textarea id="ingredients" rows={5} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
          </div>
        )}

        {(ct === "recipe" || ct === "routine") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, steps: [...form.steps, { title: "", detail: "" }] })}>
                + Add step
              </Button>
            </div>
            {form.steps.length === 0 && <p className="text-xs text-muted-foreground">Use AI or add steps manually.</p>}
            {form.steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={s.title} onChange={(e) => {
                    const ns = [...form.steps]; ns[i] = { ...s, title: e.target.value }; setForm({ ...form, steps: ns });
                  }} placeholder={`Step ${i + 1} title`} />
                  {ct === "routine" && (
                    <Input type="number" className="w-24" value={s.duration_min ?? ""} onChange={(e) => {
                      const ns = [...form.steps]; ns[i] = { ...s, duration_min: e.target.value ? Number(e.target.value) : undefined }; setForm({ ...form, steps: ns });
                    }} placeholder="min" />
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}>×</Button>
                </div>
                <Textarea rows={2} value={s.detail} onChange={(e) => {
                  const ns = [...form.steps]; ns[i] = { ...s, detail: e.target.value }; setForm({ ...form, steps: ns });
                }} placeholder="What to do, how it feels…" />
              </div>
            ))}
          </div>
        )}

        {ct === "tip" && (
          <div className="space-y-1.5">
            <Label htmlFor="tip">The tip</Label>
            <Textarea id="tip" rows={3} value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="One short, actionable idea." />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="body">{ct === "tip" ? "Context (optional)" : "Body (Markdown ok)"}</Label>
          <Textarea id="body" rows={ct === "tip" ? 3 : 12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="skincare, evening, hydration" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
            {saving ? "Publishing…" : "Publish"}
          </Button>
          <Button variant="ghost" onClick={() => setForm(empty)} disabled={saving}>Reset</Button>
        </div>
      </section>
    </div>
  );
}
