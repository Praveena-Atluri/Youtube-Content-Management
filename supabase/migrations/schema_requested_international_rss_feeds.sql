-- Validated top-level RSS feeds from the publisher sites requested in August 2026.
--
-- Intentionally excluded:
--   * Caravan Magazine: no publisher RSS/Atom endpoint discovered.
--   * AP News: /index.rss requires client credentials (HTTP 401).
--   * National Crime Agency: no publisher RSS endpoint; common paths return 404.
--   * UNODC: the two publisher-linked feeds currently contain malformed XML.
--   * NDTV Auto: the publisher-listed endpoint currently returns non-XML content.
--
-- Existing Indian Express Home, Indian Express Health & Wellness, and NDTV
-- Sports rows are preserved and not repeated here. CNN's legacy feeds only work
-- over HTTP and are included intentionally.

with candidate_feeds (
  source,
  label,
  url,
  category_hint,
  active,
  display_order
) as (
values
  -- BBC
  ('BBC News', 'BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'news', true, 6000),
  ('BBC News', 'BBC News - World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'news', true, 6001),
  ('BBC News', 'BBC News - UK', 'https://feeds.bbci.co.uk/news/uk/rss.xml', 'news', true, 6002),
  ('BBC News', 'BBC News - Politics', 'https://feeds.bbci.co.uk/news/politics/rss.xml', 'news', true, 6003),
  ('BBC News', 'BBC News - Education', 'https://feeds.bbci.co.uk/news/education/rss.xml', 'news', true, 6004),
  ('BBC News', 'BBC News - Business', 'https://feeds.bbci.co.uk/news/business/rss.xml', 'business', true, 6005),
  ('BBC News', 'BBC News - Health', 'https://feeds.bbci.co.uk/news/health/rss.xml', 'health', true, 6006),
  ('BBC News', 'BBC News - Science & Environment', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'tech', true, 6007),
  ('BBC News', 'BBC News - Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'tech', true, 6008),
  ('BBC News', 'BBC News - Entertainment & Arts', 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', 'movies', true, 6009),
  ('BBC Sport', 'BBC Sport', 'https://feeds.bbci.co.uk/sport/rss.xml?edition=uk', 'sports', true, 6010),

  -- FBI
  ('FBI', 'FBI - Top Stories', 'https://www.fbi.gov/feeds/fbi-top-stories/rss.xml', 'news', true, 6011),
  ('FBI', 'FBI - National Press Releases', 'https://www.fbi.gov/feeds/national-press-releases/rss.xml', 'news', true, 6012),
  ('FBI', 'FBI - Executive Speeches', 'https://www.fbi.gov/feeds/executive-speeches/rss.xml', 'news', true, 6013),
  ('FBI', 'FBI - Congressional Testimony', 'https://www.fbi.gov/feeds/congressional-testimony/rss.xml', 'news', true, 6014),
  ('FBI', 'FBI - News Blog', 'https://www.fbi.gov/feeds/news-blog/rss.xml', 'news', true, 6015),
  ('FBI', 'FBI - All Wanted', 'https://www.fbi.gov/feeds/all-wanted/rss.xml', 'news', true, 6016),

  -- CBS News topic feeds (broadcast and show feeds are intentionally omitted)
  ('CBS News', 'CBS News - Top Stories', 'https://www.cbsnews.com/latest/rss/main', 'news', true, 6017),
  ('CBS News', 'CBS News - U.S.', 'https://www.cbsnews.com/latest/rss/us', 'news', true, 6018),
  ('CBS News', 'CBS News - Politics', 'https://www.cbsnews.com/latest/rss/politics', 'news', true, 6019),
  ('CBS News', 'CBS News - World', 'https://www.cbsnews.com/latest/rss/world', 'news', true, 6020),
  ('CBS News', 'CBS News - Investigations', 'https://www.cbsnews.com/latest/rss/evening-news/cbs-news-investigates', 'news', true, 6021),
  ('CBS News', 'CBS News - Health', 'https://www.cbsnews.com/latest/rss/health', 'health', true, 6022),
  ('CBS News', 'CBS News - MoneyWatch', 'https://www.cbsnews.com/latest/rss/moneywatch', 'business', true, 6023),
  ('CBS News', 'CBS News - Science', 'https://www.cbsnews.com/latest/rss/science', 'tech', true, 6024),
  ('CBS News', 'CBS News - Technology', 'https://www.cbsnews.com/latest/rss/technology', 'tech', true, 6025),
  ('CBS News', 'CBS News - Space', 'https://www.cbsnews.com/latest/rss/space', 'tech', true, 6026),
  ('CBS News', 'CBS News - Entertainment', 'https://www.cbsnews.com/latest/rss/entertainment', 'movies', true, 6027),

  ('InSight Crime', 'InSight Crime', 'https://insightcrime.org/feed/', 'news', true, 6028),

  -- CNN (the publisher's RSS host currently works only over HTTP)
  ('CNN', 'CNN - Edition', 'http://rss.cnn.com/rss/edition.rss', 'news', true, 6029),
  ('CNN', 'CNN - World', 'http://rss.cnn.com/rss/edition_world.rss', 'news', true, 6030),
  ('CNN', 'CNN - U.S.', 'http://rss.cnn.com/rss/edition_us.rss', 'news', true, 6031),
  ('CNN', 'CNN - Money', 'http://rss.cnn.com/rss/money_latest.rss', 'business', true, 6032),
  ('CNN', 'CNN - Technology', 'http://rss.cnn.com/rss/edition_technology.rss', 'tech', true, 6033),
  ('CNN', 'CNN - Entertainment', 'http://rss.cnn.com/rss/edition_entertainment.rss', 'movies', true, 6034),
  ('CNN', 'CNN - Sport', 'http://rss.cnn.com/rss/edition_sport.rss', 'sports', true, 6035),

  ('India Crime', 'India Crime', 'https://www.indiacrime.com/feed/', 'news', true, 6036),

  -- NDTV (the existing NDTV Sports URL is not repeated)
  ('NDTV', 'NDTV - Top Stories', 'https://feeds.feedburner.com/ndtvnews-top-stories', 'news', true, 6037),
  ('NDTV', 'NDTV - Latest', 'https://feeds.feedburner.com/ndtvnews-latest', 'news', true, 6038),
  ('NDTV', 'NDTV - Trending', 'https://feeds.feedburner.com/ndtvnews-trending-news', 'news', true, 6039),
  ('NDTV', 'NDTV - India', 'https://feeds.feedburner.com/ndtvnews-india-news', 'news', true, 6040),
  ('NDTV', 'NDTV - World', 'https://feeds.feedburner.com/ndtvnews-world-news', 'news', true, 6041),
  ('NDTV', 'NDTV - Cities', 'https://feeds.feedburner.com/ndtvnews-cities-news', 'news', true, 6042),
  ('NDTV', 'NDTV - South', 'https://feeds.feedburner.com/ndtvnews-south', 'news', true, 6043),
  ('NDTV', 'NDTV - Indians Abroad', 'https://feeds.feedburner.com/ndtvnews-indians-abroad', 'news', true, 6044),
  ('NDTV', 'NDTV - Offbeat', 'https://feeds.feedburner.com/ndtvnews-offbeat-news', 'news', true, 6045),
  ('NDTV', 'NDTV - People', 'https://feeds.feedburner.com/ndtvnews-people', 'news', true, 6046),
  ('NDTV', 'NDTV - Hindi', 'https://feeds.feedburner.com/ndtvkhabar-latest', 'news', true, 6047),
  ('NDTV', 'NDTV - Videos', 'https://feeds.feedburner.com/ndtv/latest-videos', 'news', true, 6048),
  ('NDTV', 'NDTV - Business', 'https://feeds.feedburner.com/ndtvprofit-latest', 'business', true, 6049),
  ('NDTV', 'NDTV - Movies', 'https://feeds.feedburner.com/ndtvmovies-latest', 'movies', true, 6050),
  ('NDTV', 'NDTV - Cricket', 'https://feeds.feedburner.com/ndtvsports-cricket', 'sports', true, 6051),
  ('NDTV', 'NDTV - Tech', 'https://feeds.feedburner.com/gadgets360-latest', 'tech', true, 6052),
  ('NDTV', 'NDTV - Health', 'https://feeds.feedburner.com/ndtvcooks-latest', 'health', true, 6053),

  ('Deccan Herald', 'Deccan Herald', 'https://www.deccanherald.com/stories.rss', 'news', true, 6054),

  -- The Guardian
  ('The Guardian', 'The Guardian - International', 'https://www.theguardian.com/international/rss', 'news', true, 6055),
  ('The Guardian', 'The Guardian - World', 'https://www.theguardian.com/world/rss', 'news', true, 6056),
  ('The Guardian', 'The Guardian - UK', 'https://www.theguardian.com/uk-news/rss', 'news', true, 6057),
  ('The Guardian', 'The Guardian - U.S.', 'https://www.theguardian.com/us-news/rss', 'news', true, 6058),
  ('The Guardian', 'The Guardian - Australia', 'https://www.theguardian.com/australia-news/rss', 'news', true, 6059),
  ('The Guardian', 'The Guardian - Opinion', 'https://www.theguardian.com/commentisfree/rss', 'news', true, 6060),
  ('The Guardian', 'The Guardian - Society', 'https://www.theguardian.com/society/rss', 'news', true, 6061),
  ('The Guardian', 'The Guardian - Business', 'https://www.theguardian.com/business/rss', 'business', true, 6062),
  ('The Guardian', 'The Guardian - Technology', 'https://www.theguardian.com/technology/rss', 'tech', true, 6063),
  ('The Guardian', 'The Guardian - Science', 'https://www.theguardian.com/science/rss', 'tech', true, 6064),
  ('The Guardian', 'The Guardian - Environment', 'https://www.theguardian.com/environment/rss', 'tech', true, 6065),
  ('The Guardian', 'The Guardian - Sport', 'https://www.theguardian.com/sport/rss', 'sports', true, 6066),
  ('The Guardian', 'The Guardian - Culture', 'https://www.theguardian.com/culture/rss', 'movies', true, 6067),
  ('The Guardian', 'The Guardian - Film', 'https://www.theguardian.com/film/rss', 'movies', true, 6068),
  ('The Guardian', 'The Guardian - Music', 'https://www.theguardian.com/music/rss', 'movies', true, 6069),
  ('The Guardian', 'The Guardian - TV & Radio', 'https://www.theguardian.com/tv-and-radio/rss', 'movies', true, 6070),
  ('The Guardian', 'The Guardian - Stage', 'https://www.theguardian.com/stage/rss', 'movies', true, 6071),
  ('The Guardian', 'The Guardian - Life and Style', 'https://www.theguardian.com/lifeandstyle/rss', 'health', true, 6072),
  ('The Guardian', 'The Guardian - Health & Wellbeing', 'https://www.theguardian.com/lifeandstyle/health-and-wellbeing/rss', 'health', true, 6073),

  -- Indian Express (Home and Health & Wellness already exist)
  ('Indian Express', 'Indian Express - India', 'https://indianexpress.com/section/india/feed/', 'news', true, 6074),
  ('Indian Express', 'Indian Express - World', 'https://indianexpress.com/section/world/feed/', 'news', true, 6075),
  ('Indian Express', 'Indian Express - Cities', 'https://indianexpress.com/section/cities/feed/', 'news', true, 6076),
  ('Indian Express', 'Indian Express - Politics', 'https://indianexpress.com/section/politics/feed/', 'news', true, 6077),
  ('Indian Express', 'Indian Express - Opinion', 'https://indianexpress.com/section/opinion/feed/', 'news', true, 6078),
  ('Indian Express', 'Indian Express - Explained', 'https://indianexpress.com/section/explained/feed/', 'news', true, 6079),
  ('Indian Express', 'Indian Express - Education', 'https://indianexpress.com/section/education/feed/', 'news', true, 6080),
  ('Indian Express', 'Indian Express - North East', 'https://indianexpress.com/section/north-east-india/feed/', 'news', true, 6081),
  ('Indian Express', 'Indian Express - Elections', 'https://indianexpress.com/elections/feed/', 'news', true, 6082),
  ('Indian Express', 'Indian Express - Trending', 'https://indianexpress.com/section/trending/feed/', 'news', true, 6083),
  ('Indian Express', 'Indian Express - Business', 'https://indianexpress.com/section/business/feed/', 'business', true, 6084),
  ('Indian Express', 'Indian Express - Sports', 'https://indianexpress.com/section/sports/feed/', 'sports', true, 6085),
  ('Indian Express', 'Indian Express - Entertainment', 'https://indianexpress.com/section/entertainment/feed/', 'movies', true, 6086),
  ('Indian Express', 'Indian Express - Technology', 'https://indianexpress.com/section/technology/feed/', 'tech', true, 6087),
  ('Indian Express', 'Indian Express - Lifestyle', 'https://indianexpress.com/section/lifestyle/feed/', 'health', true, 6088),

  ('Al Jazeera', 'Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'news', true, 6089),
  ('Crimewatch', 'Crimewatch', 'https://crimewatch.net/rss.xml', 'news', true, 6090),

  -- India Today
  ('India Today', 'India Today - Home', 'https://www.indiatoday.in/rss/home', 'news', true, 6091),
  ('India Today', 'India Today - Nation', 'https://www.indiatoday.in/rss/1206514', 'news', true, 6092),
  ('India Today', 'India Today - Big Story', 'https://www.indiatoday.in/rss/1206614', 'news', true, 6093),
  ('India Today', 'India Today - Cover Story', 'https://www.indiatoday.in/rss/1206509', 'news', true, 6094),
  ('India Today', 'India Today - Glass House', 'https://www.indiatoday.in/rss/1206610', 'news', true, 6095),
  ('India Today', 'India Today - Glossary', 'https://www.indiatoday.in/rss/1206613', 'news', true, 6096),
  ('India Today', 'India Today - Top Stories', 'https://www.indiatoday.in/rss/1206584', 'news', true, 6097),
  ('India Today', 'India Today - States', 'https://www.indiatoday.in/rss/1206500', 'news', true, 6098),
  ('India Today', 'India Today - World', 'https://www.indiatoday.in/rss/1206577', 'news', true, 6099),
  ('India Today', 'India Today - Photos', 'https://www.indiatoday.in/rss-gallery', 'news', true, 6100),
  ('India Today', 'India Today - Videos', 'https://www.indiatoday.in/rss-video', 'news', true, 6101),
  ('India Today', 'India Today - Economy', 'https://www.indiatoday.in/rss/1206513', 'business', true, 6102),
  ('India Today', 'India Today - Sport', 'https://www.indiatoday.in/rss/1206550', 'sports', true, 6103),
  ('India Today', 'India Today - Eyecatchers', 'https://www.indiatoday.in/rss/1206494', 'movies', true, 6104),
  ('India Today', 'India Today - Society and the Arts', 'https://www.indiatoday.in/rss/1206504', 'movies', true, 6105),
  ('India Today', 'India Today - Leisure', 'https://www.indiatoday.in/rss/1206551', 'health', true, 6106),
  ('India Today', 'India Today - Offtrack', 'https://www.indiatoday.in/rss/1206503', 'health', true, 6107),
  ('India Today', 'India Today - Your Week', 'https://www.indiatoday.in/rss/1206506', 'health', true, 6108)
)
insert into public.feed_sources (
  source,
  label,
  url,
  category_hint,
  active,
  display_order
)
select
  candidate.source,
  candidate.label,
  candidate.url,
  candidate.category_hint,
  candidate.active,
  candidate.display_order
from candidate_feeds as candidate
where not exists (
  select 1
  from public.feed_sources as existing
  where lower(rtrim(existing.url, '/')) = lower(rtrim(candidate.url, '/'))
)
on conflict (url) do nothing;
