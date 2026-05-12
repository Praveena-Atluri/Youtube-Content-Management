# Telugu Media Content Scout

A Next.js 15 dashboard for scouting Telugu trends, deduplicating them with `pgvector`, and generating video-ready Telugu content packs.

## Stack

- Next.js 15 App Router
- Shadcn-style UI components
- Supabase Postgres + `pgvector`
- Supabase Edge Function for feed ingestion
- OpenAI for embeddings and Telugu script generation

## Features

- Sidebar dashboard with a category dropdown for `News` and `Movies`
- RSS ingestion from Telugu and tech feeds
- Embedding-based duplicate detection using a Supabase SQL RPC
- Unique story listing sorted by virality
- One-click generation for:
  - Telugu 5-minute long-form script
  - Telugu 60-second short script
  - 3 suggested titles
  - 1 SEO description
  - Content plan based on trend intensity

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values into `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your Supabase and OpenAI credentials.

4. Apply the migration in Supabase:

```bash
supabase db push
```

5. Run the app:

```bash
npm run dev
```

## Deploy to Supabase

1. Create a Supabase project and enable the `vector` extension.
2. Run the SQL migration in [supabase/migrations/20260511140500_init_trending_topics.sql](/Users/praveena.atluri/Documents/youtube-content-management/supabase/migrations/20260511140500_init_trending_topics.sql:1).
3. Deploy the edge function:

```bash
supabase functions deploy sync-feeds --no-verify-jwt
```

4. Add secrets:

```bash
supabase secrets set OPENAI_API_KEY=... OPENAI_EMBED_MODEL=text-embedding-3-small
```

## Deploy to Vercel

1. Import the repo into Vercel.
2. Add the env vars from [.env.example](/Users/praveena.atluri/Documents/youtube-content-management/.env.example:1).
3. Optionally protect `/api/sync` with `CRON_SECRET` and call it from Vercel Cron.

## Notes

- Because the requested category model is only `news | movies`, tech stories are ingested under `news` unless movie-related keywords are detected.
- The duplicate filter uses a cosine similarity threshold of `0.92`, which you can tune in [lib/sync-feeds.ts](/Users/praveena.atluri/Documents/youtube-content-management/lib/sync-feeds.ts:62).
