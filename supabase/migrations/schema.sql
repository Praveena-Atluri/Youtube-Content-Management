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
    create type trending_category_v3 as enum ('news', 'movies', 'tech', 'sports', 'business');
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
  category_hint  text not null check (category_hint in ('news', 'movies', 'tech', 'sports', 'business')),
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

create index if not exists trending_topics_category_idx             on public.trending_topics (category);
create index if not exists trending_topics_inserted_at_idx          on public.trending_topics (inserted_at desc);
create index if not exists trending_topics_virality_idx             on public.trending_topics (virality_score desc);
create index if not exists trending_topics_inserted_at_virality_idx on public.trending_topics (inserted_at desc, virality_score desc);
create index if not exists trending_topics_category_inserted_at_idx on public.trending_topics (category, inserted_at desc, virality_score desc);

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
  ('Great Andhra Telugu',  'Great Andhra',    'https://telugu.greatandhra.com/feed',                                  'news',   true,  91),
  ('Telugu Post',          'Telugu Post',     'https://www.telugupost.com/feed',                                      'news',   true,  92),
  ('Disha Daily',          'Disha Daily',     'https://www.dishadaily.com/feed',                                      'news',   true,  93),
  ('Mahanaadu',            'Mahanaadu',       'https://mahanaadu.com/feed/',                                          'news',   true,  94),
  ('BBC Telugu',           'BBC Telugu',      'https://feeds.bbci.co.uk/telugu/rss.xml',                              'news',   true,  95),
  -- tech
  ('Lux',                  'Lux Camera',      'https://lux.camera/rss',                                               'tech',   true, 100),
  ('TechRadar',            'TechRadar',       'https://www.techradar.com/rss',                                        'tech',   true, 110),
  ('404 Media',            '404 Media',       'https://www.404media.co/rss/',                                         'tech',   true, 120),
  ('Ars Technica',         'Ars Technica',    'https://arstechnica.com/feed/',                                        'tech',   true, 130),
  ('TechCrunch',           'TechCrunch',      'https://techcrunch.com/feed/',                                         'tech',   true, 140),
  ('Wired',                'Wired',           'https://www.wired.com/feed',                                           'tech',   true, 150),
  -- movies
  ('123Telugu',            '123 Telugu',      'https://www.123telugu.com/rss',                                        'movies', true, 160),
  ('123Telugu',            '123 Telugu',      'https://www.123telugu.com/category/mnews/rss',                          'movies', true, 161),
  ('123Telugu',            '123 Telugu',      'https://www.123telugu.com/category/reviews/rss',                        'movies', true, 162),
  ('123Telugu',            '123 Telugu',      'https://www.123telugu.com/category/interviews/rss',                     'movies', true, 163),
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
  ('IndianSportsBuzz',     'IndianSportsBuzz','https://www.indiansportsbuzz.in/feed/',                                'sports',   true, 280),
  -- sports additions
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/sports',                                   'sports',   true, 290),
  -- tech additions
  ('Telugu Tech',          'Telugu Tech',     'https://telugutech.in/category/tech-news/feed/',                        'tech',     true, 160),
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/technology',                               'tech',     true, 170),
  -- business
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/goodreturns-telugu-fb.xml',             'business', true, 100),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-money-classroom-fb.xml',         'business', true, 101),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-money-news-fb.xml',              'business', true, 102),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-money-personal-finance-fb.xml',  'business', true, 103),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-msme-fb.xml',                    'business', true, 104),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-market-upadate-fb.xml',          'business', true, 105),
  ('Good Returns',         'Good Returns',    'https://telugu.goodreturns.in/rss/feeds/telugu-silver-price-fb.xml',            'business', true, 106),
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/companies',                                'business', true, 110),
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/opinion',                                  'business', true, 111),
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/markets',                                  'business', true, 112),
  ('Live Mint',            'Live Mint',       'https://www.livemint.com/rss/money',                                    'business', true, 113),
  ('Economic Times',       'Economic Times',  'https://economictimes.indiatimes.com/rssfeedsdefault.cms',               'business', true, 120),
  ('Bloomberg',            'Bloomberg',       'https://prod-qt-images.s3.amazonaws.com/production/bloombergquint/feed.xml', 'business', true, 130),
  ('The Hindu Business',   'The Hindu',       'https://www.thehindubusinessline.com/?service=rss',                     'business', true, 140),
  ('Business Standard',    'Business Standard','https://www.business-standard.com/rss/home_page_top_stories.rss',      'business', true, 150),
  ('Insights Success',     'Insights Success','https://insightssuccess.com/feed/',                                      'business', true, 160),
  ('Yahoo Finance',        'Yahoo Finance',   'https://finance.yahoo.com/news/rssindex',                                'business', true, 170),
  ('Investing',            'Investing',       'https://www.investing.com/rss/news.rss',                                 'business', true, 180),
  ('Seeking Alpha',        'Seeking Alpha',   'https://seekingalpha.com/market_currents.xml',                           'business', true, 190),
  ('NDTV Profit',          'NDTV Profit',     'https://www.ndtvprofit.com/rss',                                         'business', true, 200),
  -- news: ABP Live
  ('ABP Live Telugu', 'ABP Live - Election',        'https://telugu.abplive.com/election/feed',                    'news', true,  96),
  ('ABP Live Telugu', 'ABP Live - Fact Check',      'https://telugu.abplive.com/fact-check/feed',                  'news', true,  97),
  ('ABP Live Telugu', 'ABP Live - India@2047',      'https://telugu.abplive.com/india-at-2047/feed',               'news', true,  98),
  ('ABP Live Telugu', 'ABP Live - Politics',        'https://telugu.abplive.com/politics/feed',                    'news', true,  99),
  ('ABP Live Telugu', 'ABP Live - Andhra Pradesh',  'https://telugu.abplive.com/andhra-pradesh/feed',              'news', true, 100),
  ('ABP Live Telugu', 'ABP Live - Amaravati',       'https://telugu.abplive.com/andhra-pradesh/amravati/feed',     'news', true, 101),
  ('ABP Live Telugu', 'ABP Live - Crime',           'https://telugu.abplive.com/crime/feed',                       'news', true, 102),
  ('ABP Live Telugu', 'ABP Live - News',            'https://telugu.abplive.com/news/feed',                        'news', true, 103),
  ('ABP Live Telugu', 'ABP Live - World',           'https://telugu.abplive.com/news/world/feed',                  'news', true, 104),
  ('ABP Live Telugu', 'ABP Live - India',           'https://telugu.abplive.com/news/india/feed',                  'news', true, 105),
  ('ABP Live Telugu', 'ABP Live - Telangana',       'https://telugu.abplive.com/telangana/feed',                   'news', true, 106),
  ('ABP Live Telugu', 'ABP Live - Hyderabad',       'https://telugu.abplive.com/telangana/hyderabad/feed',         'news', true, 107),
  ('ABP Live Telugu', 'ABP Live - Trending',        'https://telugu.abplive.com/trending/feed',                    'news', true, 108),
  -- news: Muchata
  ('Muchata',         'Muchata',                    'https://muchata.com/feed/',                                   'news', true, 109),
  -- movies: ABP Live
  ('ABP Live Telugu', 'ABP Live - Entertainment',   'https://telugu.abplive.com/entertainment/feed',               'movies', true, 240),
  ('ABP Live Telugu', 'ABP Live - Cinema',          'https://telugu.abplive.com/entertainment/cinema/feed',        'movies', true, 241),
  ('ABP Live Telugu', 'ABP Live - Movie Reviews',   'https://telugu.abplive.com/entertainment/movie-review/feed',  'movies', true, 242),
  ('ABP Live Telugu', 'ABP Live - TV',              'https://telugu.abplive.com/entertainment/tv/feed',            'movies', true, 243),
  ('ABP Live Telugu', 'ABP Live - OTT',             'https://telugu.abplive.com/entertainment/ott-webseries/feed', 'movies', true, 244),
  -- sports: ABP Live
  ('ABP Live Telugu', 'ABP Live - Sports',          'https://telugu.abplive.com/sports/feed',                      'sports', true, 300),
  ('ABP Live Telugu', 'ABP Live - Cricket',         'https://telugu.abplive.com/sports/cricket/feed',              'sports', true, 301),
  ('ABP Live Telugu', 'ABP Live - Olympics',        'https://telugu.abplive.com/sports/olympics/feed',             'sports', true, 302),
  ('ABP Live Telugu', 'ABP Live - IPL',             'https://telugu.abplive.com/sports/ipl/feed',                  'sports', true, 303),
  ('ABP Live Telugu', 'ABP Live - Football',        'https://telugu.abplive.com/sports/football/feed',             'sports', true, 304),
  -- business: ABP Live
  ('ABP Live Telugu', 'ABP Live - Business',        'https://telugu.abplive.com/business/feed',                    'business', true, 210),
  ('ABP Live Telugu', 'ABP Live - Personal Finance', 'https://telugu.abplive.com/business/personal-finance/feed',  'business', true, 211),
  ('ABP Live Telugu', 'ABP Live - Mutual Funds',    'https://telugu.abplive.com/business/mutual-funds/feed',       'business', true, 212),
  ('ABP Live Telugu', 'ABP Live - IPO',             'https://telugu.abplive.com/business/ipo/feed',                'business', true, 213),
  ('ABP Live Telugu', 'ABP Live - Budget',          'https://telugu.abplive.com/business/budget/feed',             'business', true, 214),
  -- tech: ABP Live
  ('ABP Live Telugu', 'ABP Live - Tech',            'https://telugu.abplive.com/tech/feed',                        'tech', true, 180),
  ('ABP Live Telugu', 'ABP Live - Gadgets',         'https://telugu.abplive.com/tech/gadgets/feed',                'tech', true, 181),
  ('ABP Live Telugu', 'ABP Live - Laptops',         'https://telugu.abplive.com/tech/laptop/feed',                 'tech', true, 182),
  ('ABP Live Telugu', 'ABP Live - Mobiles',         'https://telugu.abplive.com/tech/mobiles/feed',                'tech', true, 183)
on conflict (url) do update
set
  source        = excluded.source,
  label         = excluded.label,
  category_hint = excluded.category_hint,
  active        = excluded.active,
  display_order = excluded.display_order,
  updated_at    = now();
