# Media Radar

A Next.js 15 dashboard for scouting Telugu trends, deduplicating them by source URL, and generating creator-ready outputs through a Gemini Gem workflow.

## Stack

- Next.js 15 App Router
- Shadcn-style UI components
- Supabase Postgres
- Supabase Edge Function for feed ingestion
- Gemini Gem handoff for script generation

## Features

- Sidebar dashboard with `All`, `News`, `Movies`, and `Tech`
- Sorting by `Virality Score`, `Published`, or `Synced Time`
- RSS ingestion from Telugu news feeds and dedicated tech feeds
- Feed sources managed in Supabase through a `feed_sources` table
- Source URL-based duplicate detection
- Unique story listing limited to the last 24 hours
- Automatic cleanup of stories whose sync time is older than 24 hours
- Gemini Gem handoff for both video and web story creation

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values into `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your Supabase credentials.
   Optional:
   set `MOVIE_KEYWORDS` as a comma-separated or newline-separated list if you want to override the default movie keyword set.

4. Apply the migrations in Supabase:

```bash
supabase db push
```

5. Run the app:

```bash
npm run dev
```

## Deploy to Supabase

1. Create a Supabase project.
2. Run the SQL migrations in order from [supabase/migrations](/Users/praveena.atluri/Documents/youtube-content-management/supabase/migrations:1).
3. Deploy the edge function:

```bash
supabase functions deploy sync-feeds --no-verify-jwt
```

## Deploy to Vercel

1. Import the repo into Vercel.
2. Add the env vars from [.env.example](/Users/praveena.atluri/Documents/youtube-content-management/.env.example:1).
3. Optionally protect `/api/sync` with `CRON_SECRET` and call it from Vercel Cron.

## Notes

- Active categories are `news`, `movies`, and `tech`.
- Active feed sources are loaded from `public.feed_sources` in Supabase.
- Movie classification is keyword-based and can be overridden with `MOVIE_KEYWORDS`.
- Movie classification also checks the resolved source/article URL.
- Any non-tech story that does not match movie keywords falls back to `news`.
- Duplicate detection is based on normalized source URLs.
