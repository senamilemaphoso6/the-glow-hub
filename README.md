The Glow Hub
A premium, inclusive self-care content platform for women built with
React, TanStack Start, Tailwind CSS, Supabase (Lovable Cloud), and the
Lovable AI Gateway (openai/gpt-5-mini).

The Glow Hub lets creators publish four content formats which are blog posts,
skincare recipes, routines and quick Tips with an AI co-writer that
produces structured schema-validated drafts users can edit and publish.

Features
Four content types with format-specific editors and renderers.
AI Co-writer one click generates a full draft (title, excerpt,
body, tags, ingredients/steps/tip) from a topic + optional notes.
Unified feed with content-type filters and search.
Trending tags sidebar powered by published-post tags.
Auth + profiles display name, bio, avatar.
Personal dashboard to view and manage your published posts.
Premium design system warm ivory, terracotta, and forest green
with Fraunces display + Inter body type.

Tech Stack
Layer	Tech
Framework	TanStack Start v1 + React 19
Styling	Tailwind CSS v4 (semantic tokens in src/styles.css)
Backend	Lovable Cloud (Supabase) — Postgres, Auth, RLS
AI	Lovable AI Gateway → openai/gpt-5-mini
Validation	Zod schemas on every server function
🗄 Data Model
profiles (id, display_name, bio, avatar_url)
posts    (id, author_id, content_type, title, excerpt, body,
          data jsonb, tags text[], cover_url, published, timestamps)

content_type ENUM: 'blog' | 'recipe' | 'routine' | 'tip'
RLS: anyone can read published posts; only the author can insert/update
their own. A trigger auto-creates a profile row on signup.

AI Generation Flow
User enters a topic + optional notes in /create/$type.
Client calls the generateContent server function.
Server hits Lovable AI Gateway with a type-specific system prompt.
Response is validated against a Zod schema (title, excerpt, body,
tags, data) and returned to the editor.
User edits the draft and publishes — saved to the posts table.
See prompt-library.md for all system prompts and example user
prompts, and prompt-engineering-case-study.docx for the deeper
design rationale.

Getting Started
bun install
bun run dev
Lovable Cloud is auto-provisioned — no .env setup required. The AI
Gateway key (LOVABLE_API_KEY) is injected into server functions
automatically.

Project Structure
src/
├─ routes/           # File-based routing (TanStack Start)
│  ├─ index.tsx      # Unified feed + filters + sidebar
│  ├─ create.$type.tsx
│  ├─ post.$id.tsx
│  ├─ dashboard.tsx
│  ├─ profile.tsx
│  └─ auth.tsx
├─ components/       # Header, PostCard, TypeFilter, TrendingSidebar…
├─ lib/
│  ├─ ai-generate.functions.ts  # Server fn → Lovable AI Gateway
│  └─ types.ts
└─ integrations/supabase/       # Auto-generated client + types
Design Tokens
Defined in src/styles.css using OKLCH:

Ivory background — warm, low-glare.
Terracotta primary — confident, womanly, energizing.
Forest green accent — grounded, herbal, calming.
Fraunces for display, Inter for body — editorial meets modern.
