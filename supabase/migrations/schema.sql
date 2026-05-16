-- ============================================================
-- Consolidated schema — single file for fresh DB setup
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'trending_category_v3') then
    create type trending_category_v3 as enum ('news', 'movies', 'tech', 'sports');
  end if;
end $$;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.trending_topics (
  id             uuid primary key default gen_random_uuid(),
  category       trending_category_v3 not null,
  title          text not null,
  summary        text not null,
  content_body   text not null,
  virality_score numeric(6,2) not null default 0,
  metadata       jsonb not null default '{}'::jsonb,
  inserted_at    timestamptz not null default now()
);

create table if not exists public.feed_sources (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  label          text not null,
  url            text not null unique,
  category_hint  text not null check (category_hint in ('news', 'movies', 'tech', 'sports')),
  active         boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.youtube_videos (
  id             uuid primary key default gen_random_uuid(),
  channel_id     text not null,
  channel_name   text not null,
  video_id       text not null unique,
  title          text not null,
  thumbnail_url  text,
  published_at   timestamptz not null,
  view_count     bigint default 0,
  duration       text,
  virality_score numeric(6,2),
  inserted_at    timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists trending_topics_category_idx    on public.trending_topics (category);
create index if not exists trending_topics_inserted_at_idx on public.trending_topics (inserted_at desc);
create index if not exists trending_topics_virality_idx    on public.trending_topics (virality_score desc);

create unique index if not exists trending_topics_article_url_idx
  on public.trending_topics ((metadata->>'link'))
  where (metadata->>'link') is not null and (metadata->>'link') <> '';

create index if not exists feed_sources_active_idx
  on public.feed_sources (active, display_order, created_at);

create index if not exists youtube_videos_published_at_idx on public.youtube_videos (published_at desc);
create index if not exists youtube_videos_virality_idx     on public.youtube_videos (virality_score desc);
create index if not exists youtube_videos_channel_id_idx   on public.youtube_videos (channel_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.trending_topics  enable row level security;
alter table public.feed_sources     enable row level security;
alter table public.youtube_videos   enable row level security;

create policy "Public read trending topics"
  on public.trending_topics for select to anon, authenticated using (true);

create policy "Public read feed sources"
  on public.feed_sources for select to anon, authenticated using (true);

create policy "public read youtube_videos"
  on public.youtube_videos for select using (true);

-- ============================================================
-- Seed: feed sources
-- ============================================================

insert into public.feed_sources (source, label, url, category_hint, active, display_order)
values
  -- news
  ('NTV',                  'NTV Telugu',      'https://ntvtelugu.com/feed',                                           'news',   true,  10),
  ('V6',                   'V6 Velugu',       'https://www.v6velugu.com/feed',                                        'news',   true,  20),
  ('Mana Telangana',       'Mana Telangana',  'https://www.manatelangana.news/feed',                                  'news',   true,  30),
  ('Google News Telugu',   'Google',          'https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te',                   'news',   true,  40),
  ('Siasat',               'Siasat',          'https://www.siasat.com/feed/',                                         'news',   true,  50),
  ('Sakshi',               'Sakshi',          'https://www.sakshi.com/rss.xml',                                       'news',   true,  60),
  ('NT News',              'NT News',         'https://www.ntnews.com/feed',                                          'news',   true,  70),
  ('Andhrajyothy',         'Andhrajyothy',    'https://www.andhrajyothy.com/rss/headlines.xml',                       'news',   true,  80),
  ('Eenadu',               'Eenadu',          'https://www.eenadu.net/rss/latestnews.xml',                            'news',   true,  90),
  -- tech
  ('Lux',                  'Lux Camera',      'https://lux.camera/rss',                                               'tech',   true, 100),
  ('TechRadar',            'TechRadar',       'https://www.techradar.com/rss',                                        'tech',   true, 110),
  ('404 Media',            '404 Media',       'https://www.404media.co/rss/',                                         'tech',   true, 120),
  ('Ars Technica',         'Ars Technica',    'https://arstechnica.com/feed/',                                        'tech',   true, 130),
  ('TechCrunch',           'TechCrunch',      'https://techcrunch.com/feed/',                                         'tech',   true, 140),
  ('Wired',                'Wired',           'https://www.wired.com/feed',                                           'tech',   true, 150),
  -- movies
  ('123Telugu',            '123 Telugu',      'https://www.123telugu.com/rss',                                        'movies', true, 160),
  ('GreatAndhra',          'Great Andhra',    'https://www.greatandhra.com/movies/feed/',                             'movies', true, 170),
  ('FilmiBeat',            'Film Beat',       'https://www.filmibeat.com/rss/feeds/filmibeat-fb.xml',                 'movies', true, 180),
  ('FilmiBeat',            'Film Beat',       'https://www.filmibeat.com/rss/feeds/telugu-fb.xml',                    'movies', true, 190),
  ('FilmiBeat',            'Film Beat',       'https://www.filmibeat.com/rss/feeds/entertainment-music-fb.xml',       'movies', true, 210),
  ('FilmiBeat',            'Film Beat',       'https://www.filmibeat.com/rss/feeds/bollywood-fb.xml',                 'movies', true, 220),
  ('FilmiBeat',            'Film Beat',       'https://www.filmibeat.com/rss/feeds/interviews-fb.xml',                'movies', true, 230),
  -- sports (MyKhel disabled — blocked by Cloudflare)
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/mykhel-telugu-fb.xml',             'sports', false, 200),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-cricket-fb.xml',            'sports', false, 201),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-tennis-news-fb.xml',        'sports', false, 202),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-controversies-fb.xml',      'sports', false, 203),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-football-fb.xml',           'sports', false, 204),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-boxing-fb.xml',             'sports', false, 205),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-badminton-fb.xml',          'sports', false, 206),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-hockey-fb.xml',             'sports', false, 207),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-kabaddi-fb.xml',            'sports', false, 208),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-tennis-fb.xml',             'sports', false, 209),
  ('Telugu MyKhel',        'Telugu MyKhel',   'https://telugu.mykhel.com/rss/feeds/telugu-more-sports-fb.xml',        'sports', false, 210),
  ('The Hans India',       'The Hans India',  'https://www.thehansindia.com/sports/feed',                             'sports', true,  220),
  ('NDTV Sports',          'NDTV Sports',     'https://feeds.feedburner.com/ndtvsports-latest',                       'sports', true,  230),
  ('Times of India Sports','Times of India',  'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',             'sports', true,  240),
  ('India.com Sports',     'India.com',       'https://www.india.com/sports/feed/',                                   'sports', true,  250),
  ('Sports Pages',         'Sports Pages',    'https://sportspages.in/feed/',                                         'sports', true,  260),
  ('Economic Times Sports','Economic Times',  'https://economictimes.indiatimes.com/rssfeeds/26407562.cms',           'sports', true,  270),
  ('IndianSportsBuzz',     'IndianSportsBuzz','https://www.indiansportsbuzz.in/feed/',                                'sports', true,  280)
on conflict (url) do update
set
  source        = excluded.source,
  label         = excluded.label,
  category_hint = excluded.category_hint,
  active        = excluded.active,
  display_order = excluded.display_order,
  updated_at    = now();
