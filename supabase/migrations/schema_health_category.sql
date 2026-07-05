alter type trending_category_v3 add value if not exists 'health';

alter table public.feed_sources
  drop constraint if exists feed_sources_category_hint_check;

alter table public.feed_sources
  add constraint feed_sources_category_hint_check
  check (category_hint in ('news', 'movies', 'tech', 'sports', 'business', 'health', 'devotional'));

insert into public.feed_sources (source, label, url, category_hint, active, display_order)
values
  ('News18 Telugu', 'News18 Telugu - Life Style', 'https://telugu.news18.com/commonfeeds/v1/tel/rss/life-style.xml', 'health', true, 226),
  ('Times Now Telugu', 'Times Now Telugu - Life Style', 'https://telugu.timesnownews.com/feeds/gns-te-lifestyle.xml', 'health', true, 227),
  ('Boldsky Telugu', 'Boldsky Telugu - Life Style', 'https://telugu.boldsky.com/rss/feeds/telugu-health-fb.xml', 'health', true, 228),
  ('News Velugu', 'News Velugu - Life Style', 'https://newsvelugu.com/category/health/feed/', 'health', true, 229),
  ('OneIndia Telugu', 'OneIndia Telugu - Life Style', 'https://telugu.oneindia.com/rss/feeds/telugu-health-fb.xml', 'health', true, 230),
  ('NT News', 'NT News - Life Style', 'https://www.ntnews.com/health/feed', 'health', true, 231)
on conflict (url) do update
set
  source        = excluded.source,
  label         = excluded.label,
  category_hint = excluded.category_hint,
  active        = excluded.active,
  display_order = excluded.display_order,
  updated_at    = now();
