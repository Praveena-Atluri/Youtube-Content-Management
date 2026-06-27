alter type trending_category_v3 add value if not exists 'devotional';

alter table public.feed_sources
  drop constraint if exists feed_sources_category_hint_check;

alter table public.feed_sources
  add constraint feed_sources_category_hint_check
  check (category_hint in ('news', 'movies', 'tech', 'sports', 'business', 'devotional'));

insert into public.feed_sources (source, label, url, category_hint, active, display_order)
values
  ('ABP Live Telugu', 'ABP Live - Spirituality', 'https://telugu.abplive.com/spirituality/feed', 'devotional', true, 220),
  ('TV9 Telugu', 'TV9 Telugu - Spiritual', 'https://tv9telugu.com/spiritual/feed', 'devotional', true, 221),
  ('Bhakthi TV', 'Bhakthi TV', 'https://www.bhakthitv.in/feed', 'devotional', true, 222)
on conflict (url) do update
set
  source        = excluded.source,
  label         = excluded.label,
  category_hint = excluded.category_hint,
  active        = excluded.active,
  display_order = excluded.display_order,
  updated_at    = now();
