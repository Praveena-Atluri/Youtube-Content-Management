-- Removes the old YouTube performance dashboard tables from Supabase.
-- Run manually only after confirming Channel Pulse owns this data.

begin;

drop table if exists public.youtube_country_daily_metrics cascade;
drop table if exists public.youtube_content_type_daily_metrics cascade;
drop table if exists public.youtube_video_daily_metrics cascade;
drop table if exists public.youtube_channel_daily_metrics cascade;
drop table if exists public.youtube_analytics_sync_runs cascade;
drop table if exists public.youtube_video_catalog cascade;
drop table if exists public.youtube_managed_channels cascade;

commit;
