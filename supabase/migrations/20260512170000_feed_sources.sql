create table if not exists public.feed_sources (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  label text not null,
  url text not null unique,
  category_hint text not null check (category_hint in ('news', 'movies', 'tech')),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_sources_active_idx
  on public.feed_sources (active, display_order, created_at);

insert into public.feed_sources (source, label, url, category_hint, active, display_order)
values
  ('NTV', 'NTV Telugu', 'https://ntvtelugu.com/feed', 'news', true, 10),
  ('V6', 'V6 Velugu', 'https://www.v6velugu.com/feed', 'news', true, 20),
  ('Mana Telangana', 'Mana Telangana', 'https://www.manatelangana.news/feed', 'news', true, 30),
  ('Google News Telugu', 'Google News Telugu', 'https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te', 'news', true, 40),
  ('Siasat', 'Siasat', 'https://www.siasat.com/feed/', 'news', true, 50),
  ('Sakshi', 'Sakshi', 'https://www.sakshi.com/rss.xml', 'news', true, 60),
  ('NT News', 'NT News', 'https://www.ntnews.com/feed', 'news', true, 70),
  ('Andhrajyothy', 'Andhrajyothy', 'https://www.andhrajyothy.com/rss/headlines.xml', 'news', true, 80),
  ('Eenadu', 'Eenadu', 'https://www.eenadu.net/rss/latestnews.xml', 'news', true, 90),
  ('Lux', 'Lux Camera', 'https://lux.camera/rss', 'tech', true, 100),
  ('TechRadar', 'TechRadar', 'https://www.techradar.com/rss', 'tech', true, 110),
  ('404 Media', '404 Media', 'https://www.404media.co/rss/', 'tech', true, 120),
  ('Ars Technica', 'Ars Technica', 'https://arstechnica.com/feed/', 'tech', true, 130),
  ('TechCrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'tech', true, 140),
  ('Wired', 'Wired', 'https://www.wired.com/feed', 'tech', true, 150)
on conflict (url) do update
set
  source = excluded.source,
  label = excluded.label,
  category_hint = excluded.category_hint,
  active = excluded.active,
  display_order = excluded.display_order,
  updated_at = now();
