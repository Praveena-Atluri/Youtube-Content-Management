create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'trending_category'
  ) then
    create type trending_category as enum ('news', 'movies', 'tech');
  end if;
end$$;

create table if not exists public.trending_topics (
  id uuid primary key default gen_random_uuid(),
  category trending_category not null,
  title text not null,
  summary text not null,
  content_body text not null,
  virality_score numeric(6,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default now()
);

create index if not exists trending_topics_category_idx
  on public.trending_topics (category);

create index if not exists trending_topics_inserted_at_idx
  on public.trending_topics (inserted_at desc);

create index if not exists trending_topics_virality_idx
  on public.trending_topics (virality_score desc);

alter table public.trending_topics enable row level security;

create policy "Public read trending topics"
on public.trending_topics
for select
to anon, authenticated
using (true);
