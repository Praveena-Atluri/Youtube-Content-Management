alter table public.feed_sources
  drop constraint if exists feed_sources_category_hint_check;

alter table public.feed_sources
  add constraint feed_sources_category_hint_check
  check (category_hint in ('news', 'crime', 'movies', 'tech', 'sports', 'business', 'health', 'devotional'));

update public.feed_sources
set category_hint = 'crime',
    updated_at = now()
where source in ('FBI', 'InSight Crime', 'India Crime', 'Crimewatch')
   or (source = 'ABP Live Telugu' and label = 'ABP Live - Crime');

update public.trending_topics
set category = 'crime'
where metadata->>'source' in ('FBI', 'InSight Crime', 'India Crime', 'Crimewatch')
   or (
     metadata->>'source' = 'ABP Live Telugu'
     and metadata->>'feedLabel' = 'ABP Live - Crime'
   );
