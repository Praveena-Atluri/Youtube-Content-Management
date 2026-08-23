import { getActiveFeedSources } from "@/lib/feed-sources";
import { getDevotionalKeywords } from "@/lib/devotional-keywords";
import { getMovieKeywords } from "@/lib/movie-keywords";
import { getSportsKeywords } from "@/lib/sports-keywords";
import { fetchFeedItems } from "@/lib/rss";
import { resolveArticleUrl } from "@/lib/source-url";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { TrendingCategory } from "@/lib/types";

function canonicalizeArticleUrl(url: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "gclid",
      "fbclid",
      "oc",
      "gaa_at",
      "ga_source"
    ];

    for (const key of trackingParams) {
      parsed.searchParams.delete(key);
    }

    const sortedParams = [...parsed.searchParams.entries()].sort(([left], [right]) =>
      left.localeCompare(right)
    );
    parsed.search = "";
    for (const [key, value] of sortedParams) {
      parsed.searchParams.append(key, value);
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function inferTaxonomy(
  text: string,
  articleUrl: string,
  fallback: TrendingCategory,
  movieKeywords: string[],
  devotionalKeywords: string[],
  sportsKeywords: string[]
): {
  category: TrendingCategory;
} {
  const normalized = `${text} ${articleUrl}`.toLowerCase();
  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const containsWholeKeyword = (keyword: string) => {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegex(keyword.toLowerCase())}(?=$|[^\\p{L}\\p{N}])`,
      "u"
    );

    return pattern.test(normalized);
  };
  const includesAny = (keywords: string[]) => keywords.some(containsWholeKeyword);

  if (fallback === "tech") {
    return { category: "tech" };
  }

  if (fallback === "movies") {
    return { category: "movies" };
  }

  if (fallback === "sports") {
    return { category: "sports" };
  }

  if (fallback === "business") {
    return { category: "business" };
  }

  if (fallback === "health") {
    return { category: "health" };
  }

  if (fallback === "devotional") {
    return { category: "devotional" };
  }

  if (includesAny(sportsKeywords)) {
    return { category: "sports" };
  }

  if (includesAny(movieKeywords)) {
    return { category: "movies" };
  }

  if (includesAny(devotionalKeywords)) {
    return { category: "devotional" };
  }

  return { category: "news" };
}

const CATEGORY_BOOST: Record<string, number> = {
  news:     15,
  movies:   12,
  sports:   12,
  business: 10,
  health:   10,
  devotional: 10,
  tech:     8,
};

const TITLE_POWER_WORDS = ["breaking", "exclusive", "urgent", "alert", "first", "shock", "major"];
const FEED_FETCH_CONCURRENCY = 20;
const ARTICLE_RESOLUTION_CONCURRENCY = 32;
const INSERT_BATCH_SIZE = 250;
const EXISTING_STORY_PAGE_SIZE = 1000;
const SYNC_VERSION = "bounded-batch-v3";

async function mapConcurrentSettled<T, R>(
  values: readonly T[],
  concurrency: number,
  task: (value: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = { status: "fulfilled", value: await task(values[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      () => worker()
    )
  );

  return results;
}

function calculateViralityScore(input: {
  publishedAt: string;
  title: string;
  contentBody: string;
  categoryHint: string;
}) {
  const publishedTime = new Date(input.publishedAt).getTime();
  const freshnessBoost = Number.isNaN(publishedTime)
    ? 50
    : Math.max(10, 100 - ((Date.now() - publishedTime) / 3_600_000) * 4.5);

  const categoryBoost = CATEGORY_BOOST[input.categoryHint] ?? 8;

  const contentRichnessBoost = Math.min(input.contentBody.length / 50, 15);

  const titleLower = input.title.toLowerCase();
  const hasPunctuation = /[?!]/.test(input.title);
  const hasPowerWord = TITLE_POWER_WORDS.some((w) => titleLower.includes(w));
  const hasNonEnglish = /[ఀ-౿]/.test(input.title);
  const titleEngagementBoost = (hasPunctuation ? 5 : 0) + (hasPowerWord ? 5 : 0) + (hasNonEnglish ? 3 : 0);

  return Number((freshnessBoost + categoryBoost + contentRichnessBoost + titleEngagementBoost).toFixed(1));
}

function isWithinLast24Hours(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return true; // no date available — let it through
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

async function deleteStaleStories() {
  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from("trending_topics")
    .delete({ count: "exact" })
    .lt("inserted_at", cutoff);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function syncFeeds() {
  const syncStartedAt = Date.now();
  const supabase = createSupabaseAdminClient();
  const syncTime = new Date().toISOString();
  const feedSources = await getActiveFeedSources();
  const movieKeywords = getMovieKeywords();
  const devotionalKeywords = getDevotionalKeywords();
  const sportsKeywords = getSportsKeywords();
  const deleted = await deleteStaleStories();
  const existingLinks = new Set<string>();
  const existingTitles = new Set<string>();

  const existingStoryRows: Array<{ title: string | null; metadata: unknown }> = [];
  for (let offset = 0; ; offset += EXISTING_STORY_PAGE_SIZE) {
    const page = await supabase
      .from("trending_topics")
      .select("title, metadata")
      .range(offset, offset + EXISTING_STORY_PAGE_SIZE - 1);

    if (page.error) {
      throw page.error;
    }

    const rows = (page.data ?? []) as Array<{ title: string | null; metadata: unknown }>;
    existingStoryRows.push(...rows);
    if (rows.length < EXISTING_STORY_PAGE_SIZE) {
      break;
    }
  }

  for (const story of existingStoryRows) {
    const link =
      story &&
      typeof story === "object" &&
      "metadata" in story &&
      story.metadata &&
      typeof story.metadata === "object" &&
      "link" in story.metadata &&
      typeof story.metadata.link === "string"
        ? canonicalizeArticleUrl(story.metadata.link)
        : "";

    if (link) {
      existingLinks.add(link);
    }

    if (story && typeof story === "object" && "title" in story && typeof story.title === "string" && story.title) {
      existingTitles.add(normalizeTitle(story.title));
    }
  }
  const setupCompletedAt = Date.now();

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  type ResolvedItem = {
    feed: (typeof feedSources)[number];
    title: string;
    summary: string;
    contentBody: string;
    articleUrl: string;
    publishedAt: string;
  };

  type UnresolvedItem = Omit<ResolvedItem, "articleUrl"> & {
    link: string;
  };

  // Bound concurrency so a large feed inventory does not exhaust sockets or
  // amplify publisher timeouts.
  const feedResults = await mapConcurrentSettled(
    feedSources,
    FEED_FETCH_CONCURRENCY,
    async (feed) => {
      const items = await fetchFeedItems(feed.url, feed.source);
      return items
        .slice(0, 30)
        .filter((item) => isWithinLast24Hours(item.publishedAt))
        .map((item) => ({
          feed,
          title: item.title,
          summary: item.summary,
          contentBody: item.contentBody,
          link: item.link,
          publishedAt: item.publishedAt
        }) satisfies UnresolvedItem);
    }
  );
  const feedsFetchedAt = Date.now();

  const unresolved: UnresolvedItem[] = [];
  for (let index = 0; index < feedResults.length; index += 1) {
    const feedResult = feedResults[index];
    if (feedResult.status === "rejected") {
      errors.push(
        `${feedSources[index].label}: ${feedResult.reason instanceof Error ? feedResult.reason.message : String(feedResult.reason)}`
      );
      continue;
    }

    unresolved.push(...feedResult.value);
  }

  const resolutionResults = await mapConcurrentSettled(
    unresolved,
    ARTICLE_RESOLUTION_CONCURRENCY,
    async (candidate) => ({
      feed: candidate.feed,
      title: candidate.title,
      summary: candidate.summary,
      contentBody: candidate.contentBody,
      articleUrl: canonicalizeArticleUrl(
        await resolveArticleUrl(candidate.feed.source, candidate.link)
      ),
      publishedAt: candidate.publishedAt
    }) satisfies ResolvedItem
  );

  const candidates: ResolvedItem[] = [];
  for (let index = 0; index < resolutionResults.length; index += 1) {
    const result = resolutionResults[index];
    if (result.status === "rejected") {
      errors.push(
        `${unresolved[index].feed.label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
      );
    } else {
      candidates.push(result.value);
    }
  }
  const urlsResolvedAt = Date.now();

  type PreparedInsert = {
    source: string;
    row: {
      category: TrendingCategory;
      title: string;
      summary: string;
      content_body: string;
      virality_score: number;
      inserted_at: string;
      metadata: {
        source: string;
        feedLabel: string;
        link: string;
        publishedAt: string;
      };
    };
  };

  const prepared: PreparedInsert[] = [];
  for (const candidate of candidates) {
    if (candidate.articleUrl && existingLinks.has(candidate.articleUrl)) {
      skipped += 1;
      continue;
    }

    const titleKey = normalizeTitle(candidate.title);
    if (titleKey && existingTitles.has(titleKey)) {
      skipped += 1;
      continue;
    }

    const taxonomy = inferTaxonomy(
      `${candidate.title} ${candidate.summary} ${candidate.contentBody}`,
      candidate.articleUrl,
      candidate.feed.categoryHint,
      movieKeywords,
      devotionalKeywords,
      sportsKeywords
    );

    const viralityScore = calculateViralityScore({
      publishedAt: candidate.publishedAt,
      title: candidate.title,
      contentBody: candidate.contentBody,
      categoryHint: candidate.feed.categoryHint
    });

    prepared.push({
      source: candidate.feed.source,
      row: {
        category: taxonomy.category,
        title: candidate.title,
        summary: candidate.summary,
        content_body: candidate.contentBody,
        virality_score: viralityScore,
        inserted_at: syncTime,
        metadata: {
          source: candidate.feed.source,
          feedLabel: candidate.feed.label,
          link: candidate.articleUrl,
          publishedAt: candidate.publishedAt
        }
      }
    });

    if (candidate.articleUrl) {
      existingLinks.add(candidate.articleUrl);
    }
    if (titleKey) {
      existingTitles.add(titleKey);
    }

  }
  const insertsStartedAt = Date.now();

  // Split only failed batches. This isolates a rare duplicate or malformed row
  // without turning the entire batch into sequential database round trips.
  async function insertPreparedBatch(batch: PreparedInsert[]): Promise<void> {
    const batchResult = await supabase
      .from("trending_topics")
      .insert(batch.map((entry) => entry.row));

    if (!batchResult.error) {
      inserted += batch.length;
      return;
    }

    if (batch.length > 1) {
      const midpoint = Math.ceil(batch.length / 2);
      await insertPreparedBatch(batch.slice(0, midpoint));
      await insertPreparedBatch(batch.slice(midpoint));
      return;
    }

    if (batchResult.error.code === "23505") {
      skipped += 1;
    } else {
      errors.push(`${batch[0].source}: ${batchResult.error.message}`);
    }
  }

  for (let offset = 0; offset < prepared.length; offset += INSERT_BATCH_SIZE) {
    await insertPreparedBatch(prepared.slice(offset, offset + INSERT_BATCH_SIZE));
  }

  const syncCompletedAt = Date.now();
  return {
    syncVersion: SYNC_VERSION,
    inserted,
    skipped,
    deleted,
    errors,
    feeds: feedSources.length,
    candidates: candidates.length,
    prepared: prepared.length,
    timingsMs: {
      total: syncCompletedAt - syncStartedAt,
      setup: setupCompletedAt - syncStartedAt,
      fetch: feedsFetchedAt - setupCompletedAt,
      resolve: urlsResolvedAt - feedsFetchedAt,
      prepare: insertsStartedAt - urlsResolvedAt,
      insert: syncCompletedAt - insertsStartedAt
    }
  };
}
