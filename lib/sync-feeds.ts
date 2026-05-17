import { getActiveFeedSources } from "@/lib/feed-sources";
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

  if (includesAny(sportsKeywords)) {
    return { category: "sports" };
  }

  if (includesAny(movieKeywords)) {
    return { category: "movies" };
  }

  return { category: "news" };
}

const CATEGORY_BOOST: Record<string, number> = {
  news:     15,
  movies:   12,
  sports:   12,
  business: 10,
  tech:     8,
};

const TITLE_POWER_WORDS = ["breaking", "exclusive", "urgent", "alert", "first", "shock", "major"];

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
  const supabase = createSupabaseAdminClient();
  const syncTime = new Date().toISOString();
  const feedSources = await getActiveFeedSources();
  const movieKeywords = getMovieKeywords();
  const sportsKeywords = getSportsKeywords();
  const deleted = await deleteStaleStories();
  const existingLinks = new Set<string>();
  const existingTitles = new Set<string>();

  const existingStories = await supabase
    .from("trending_topics")
    .select("title, metadata")
    .limit(1000);

  if (existingStories.error) {
    throw existingStories.error;
  }

  for (const story of existingStories.data ?? []) {
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

  // Fetch all feeds and resolve all URLs concurrently
  const feedResults = await Promise.allSettled(
    feedSources.map(async (feed) => {
      const items = await fetchFeedItems(feed.url, feed.source);
      const recentItems = items
        .slice(0, 30)
        .filter((item) => isWithinLast24Hours(item.publishedAt));

      const resolved = await Promise.allSettled(
        recentItems.map(async (item) => {
          const articleUrl = canonicalizeArticleUrl(
            await resolveArticleUrl(feed.source, item.link)
          );
          return {
            feed,
            title: item.title,
            summary: item.summary,
            contentBody: item.contentBody,
            articleUrl,
            publishedAt: item.publishedAt
          } satisfies ResolvedItem;
        })
      );

      return { feed, resolved };
    })
  );

  // Collect all resolved items, recording per-feed fetch errors
  const candidates: ResolvedItem[] = [];
  for (const feedResult of feedResults) {
    if (feedResult.status === "rejected") {
      errors.push(`Feed fetch failed: ${feedResult.reason instanceof Error ? feedResult.reason.message : String(feedResult.reason)}`);
      continue;
    }
    for (const itemResult of feedResult.value.resolved) {
      if (itemResult.status === "rejected") {
        errors.push(`${feedResult.value.feed.source}: ${itemResult.reason instanceof Error ? itemResult.reason.message : String(itemResult.reason)}`);
      } else {
        candidates.push(itemResult.value);
      }
    }
  }

  // Dedup and insert sequentially to keep existingLinks/existingTitles consistent
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
      sportsKeywords
    );

    const viralityScore = calculateViralityScore({
      publishedAt: candidate.publishedAt,
      title: candidate.title,
      contentBody: candidate.contentBody,
      categoryHint: candidate.feed.categoryHint
    });

    const insertResult = await supabase.from("trending_topics").insert({
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
    });

    if (insertResult.error) {
      // unique constraint violation — another concurrent sync already inserted this URL
      if (insertResult.error.code === "23505") {
        skipped += 1;
        continue;
      }
      errors.push(`${candidate.feed.source}: ${insertResult.error.message}`);
      continue;
    }

    if (candidate.articleUrl) {
      existingLinks.add(candidate.articleUrl);
    }
    if (titleKey) {
      existingTitles.add(titleKey);
    }

    inserted += 1;
  }

  return { inserted, skipped, deleted, errors };
}
