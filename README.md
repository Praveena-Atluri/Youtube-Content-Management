# Media Radar

A Next.js 15 dashboard for scouting Telugu trends, deduplicating them by source URL, and generating creator-ready outputs through a Gemini Gem workflow.

## Stack

- Next.js 15 App Router
- Shadcn-style UI components
- Supabase Postgres
- Supabase Edge Function for feed ingestion
- Gemini Gem handoff for script generation

## Features

- Sidebar dashboard with `All`, `News`, `Crime`, `Movies`, `Sports`, `Business`, `Life Style`, `Devotional`, and `Tech`
- Sorting by `Virality Score`, `Published`, or `Synced Time`
- RSS ingestion from Telugu news feeds and dedicated category feeds
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
   Set `ACCESS_CONTROL_DEV_BYPASS=true` for local development only.
   Optional:
   set `CRIME_KEYWORDS`, `MOVIE_KEYWORDS`, `DEVOTIONAL_KEYWORDS`, or `SPORTS_KEYWORDS` as a comma-separated or newline-separated list if you want to override the default keyword sets.

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
3. Set `ALLOWED_EMAIL_DOMAINS` to approved company domains and/or `ALLOWED_EMAILS` to approved individual addresses. Both accept comma-separated values.
4. Set a strong `CRON_SECRET`; scheduled sync calls must send it in the `x-cron-secret` header.
5. Do not set `ACCESS_CONTROL_DEV_BYPASS` in Vercel. It is ignored in production even if accidentally set.

## Configure employee magic-link access

1. In Supabase Authentication, enable the Email provider and magic-link sign-in.
2. Set the Supabase Site URL to the production Media Radar URL.
3. Add `https://<your-domain>/auth/callback` to the allowed redirect URLs. Add preview callback URLs only when preview authentication is intentionally supported.
4. Apply `schema_restrict_anonymous_reads.sql` to remove public table reads.

Every user must have a Supabase session whose email either exactly matches `ALLOWED_EMAILS` or belongs to an `ALLOWED_EMAIL_DOMAINS` domain. Exact-email entries remain valid even when their domain is not listed.

## Notes

- Active categories are `news`, `crime`, `movies`, `sports`, `business`, `health`, `devotional`, and `tech`.
- Active feed sources are loaded from `public.feed_sources` in Supabase.
- Crime, movie, devotional, and sports classification is keyword-based and can be overridden with `CRIME_KEYWORDS`, `MOVIE_KEYWORDS`, `DEVOTIONAL_KEYWORDS`, and `SPORTS_KEYWORDS`.
- Crime keywords are evaluated first for general-news feeds; explicit category-specific feeds keep their configured category.
- Keyword classification also checks the resolved source/article URL.
- Any story that does not match a category hint or keyword set falls back to `news`.
- Duplicate detection is based on normalized source URLs.

### Crime sources

The dedicated Crime category includes ABP Live - Crime, InSight Crime, India Crime,
Crimewatch, and the FBI Top Stories, National Press Releases, Executive Speeches,
Congressional Testimony, News Blog, and All Wanted feeds. Crime stories from other
general-news feeds are detected using the configured English and Telugu keywords.
