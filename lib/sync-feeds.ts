import { getActiveFeedSources } from "@/lib/feed-sources";
import { getMovieKeywords } from "@/lib/movie-keywords";
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
  movieKeywords: string[]
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

  if (includesAny(movieKeywords)) {
    return { category: "movies" };
  }

  return { category: "news" };
}

function calculateViralityScore(input: {
  publishedAt: string;
  source: string;
  summary: string;
}) {
  const ageInHours = Math.max(
    1,
    (Date.now() - new Date(input.publishedAt).getTime()) / 3_600_000
  );
  const freshnessBoost = Math.max(10, 100 - ageInHours * 4.5);
  const sourceBoost =
    input.source === "Google News Telugu" ? 12 : input.source === "Sakshi" ? 8 : 5;
  const detailBoost = Math.min(input.summary.length / 14, 18);

  return Number((freshnessBoost + sourceBoost + detailBoost).toFixed(1));
}

function isWithinLast24Hours(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
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

export async function syncFeeds() {
  const supabase = createSupabaseAdminClient();
  const feedSources = await getActiveFeedSources();
  const movieKeywords = getMovieKeywords();
  const deleted = await deleteStaleStories();
  const existingLinks = new Set<string>();

  const existingStories = await supabase
    .from("trending_topics")
    .select("metadata")
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
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const feed of feedSources) {
    try {
      const items = await fetchFeedItems(feed.url, feed.source);

      for (const item of items.slice(0, 30)) {
        if (!isWithinLast24Hours(item.publishedAt)) {
          skipped += 1;
          continue;
        }

        const articleUrl = canonicalizeArticleUrl(
          await resolveArticleUrl(feed.source, item.link)
        );

        const taxonomy = inferTaxonomy(
          `${item.title} ${item.summary} ${item.contentBody}`,
          articleUrl,
          feed.categoryHint,
          movieKeywords
        );

        if (articleUrl && existingLinks.has(articleUrl)) {
          skipped += 1;
          continue;
        }

        const viralityScore = calculateViralityScore({
          publishedAt: item.publishedAt,
          source: feed.source,
          summary: item.summary
        });

        const insertResult = await supabase.from("trending_topics").insert({
          category: taxonomy.category,
          title: item.title,
          summary: item.summary,
          content_body: item.contentBody,
          virality_score: viralityScore,
          metadata: {
            source: feed.source,
            feedLabel: feed.label,
            link: articleUrl,
            publishedAt: item.publishedAt
          }
        });

        if (insertResult.error) {
          throw insertResult.error;
        }

        if (articleUrl) {
          existingLinks.add(articleUrl);
        }

        inserted += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      errors.push(`${feed.source}: ${message}`);
    }
  }

  return { inserted, skipped, deleted, errors };
}
