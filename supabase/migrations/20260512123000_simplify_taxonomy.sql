do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'trending_category_v3'
  ) then
    create type trending_category_v3 as enum (
      'news',
      'movies',
      'tech'
    );
  end if;
end$$;

alter table public.trending_topics
  alter column category type trending_category_v3
  using (
    case
      when category::text = 'movies' then 'movies'::trending_category_v3
      when category::text = 'tech' then 'tech'::trending_category_v3
      else 'news'::trending_category_v3
    end
  );

update public.trending_topics
set subcategory = null
where subcategory is not null;

drop index if exists trending_topics_subcategory_idx;
drop index if exists trending_topics_embedding_idx;

alter table public.trending_topics
  drop column if exists subcategory;
alter table public.trending_topics
  drop column if exists embedding;

drop function if exists public.match_trending_topics(vector(1536), trending_category_v3, float, int);
drop function if exists public.match_trending_topics(vector(1536), trending_category_v2, float, int);
drop function if exists public.match_trending_topics(vector(1536), trending_category, float, int);

drop type if exists trending_subcategory;
drop type if exists trending_category_v2;

drop extension if exists vector;
