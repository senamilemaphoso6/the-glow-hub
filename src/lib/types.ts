export type ContentType = "blog" | "recipe" | "routine" | "tip";

export const CONTENT_TYPES: { value: ContentType; label: string; emoji: string; blurb: string }[] = [
  { value: "blog", label: "Blog Post", emoji: "✍️", blurb: "Long-form self-care article" },
  { value: "recipe", label: "Skincare Recipe", emoji: "🌿", blurb: "DIY remedy with ingredients & steps" },
  { value: "routine", label: "Routine", emoji: "🌅", blurb: "Step-by-step wellness ritual" },
  { value: "tip", label: "Quick Tip", emoji: "💫", blurb: "Short actionable advice" },
];

export const typeMeta = (t: ContentType) =>
  CONTENT_TYPES.find((c) => c.value === t)!;

export interface Post {
  id: string;
  author_id: string;
  content_type: ContentType;
  title: string;
  excerpt: string | null;
  body: string;
  data: Record<string, unknown>;
  tags: string[];
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
}
