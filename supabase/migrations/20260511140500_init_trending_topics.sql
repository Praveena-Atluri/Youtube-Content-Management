create extension if not exists pgcrypto;
create extension if not exists vector;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'trending_category'
  ) then
    create type trending_category as enum ('news', 'movies');
  end if;
end$$;

create table if not exists public.trending_topics (
  id uuid primary key default gen_random_uuid(),
  category trending_category not null,
  title text not null,
  summary text not null,
  content_body text not null,
  embedding vector(1536) not null,
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

create index if not exists trending_topics_embedding_idx
  on public.trending_topics
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_trending_topics(
  query_embedding vector(1536),
  query_category trending_category,
  similarity_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  similarity float
)
language sql
stable
as $$
  select
    trending_topics.id,
    trending_topics.title,
    1 - (trending_topics.embedding <=> query_embedding) as similarity
  from public.trending_topics
  where trending_topics.category = query_category
    and 1 - (trending_topics.embedding <=> query_embedding) > similarity_threshold
  order by trending_topics.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.trending_topics enable row level security;

create policy "Public read trending topics"
on public.trending_topics
for select
to anon, authenticated
using (true);
