-- The web application reads these tables through its server-side service-role
-- client. Removing the permissive policies prevents callers from bypassing the
-- site access gate by querying Supabase directly with the public anon key.

drop policy if exists "Public read trending topics" on public.trending_topics;
drop policy if exists "Public read feed sources" on public.feed_sources;
drop policy if exists "public read youtube_videos" on public.youtube_videos;
