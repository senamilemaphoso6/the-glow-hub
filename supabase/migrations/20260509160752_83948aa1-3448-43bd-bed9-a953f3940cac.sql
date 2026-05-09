
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Glow Member',
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Content type enum
create type public.content_type as enum ('blog', 'recipe', 'routine', 'tip');

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content_type public.content_type not null,
  title text not null,
  excerpt text,
  body text not null default '',
  -- type-specific structured data: recipe={ingredients,steps}, routine={steps:[{title,duration}]}, tip={tip}
  data jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  cover_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "Published posts are viewable by everyone" on public.posts for select using (published = true or auth.uid() = author_id);
create policy "Users can insert own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = author_id);

create index posts_author_idx on public.posts(author_id);
create index posts_type_idx on public.posts(content_type);
create index posts_created_idx on public.posts(created_at desc);
create index posts_tags_idx on public.posts using gin(tags);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger posts_updated_at before update on public.posts for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Glow Member'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
