import { FEED_SOURCES } from "@/lib/feed-sources";
import { createEmbedding } from "@/lib/embeddings";
import { fetchFeedItems } from "@/lib/rss";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { TrendingCategory } from "@/lib/types";

const MOVIE_KEYWORDS = [
  "cinema",
  "movie",
  "film",
  "actor",
  "actress",
  "trailer",
  "ott",
  "box office",
  "సినిమా",
  "హీరో",
  "హీరోయిన్",
  "ఓటిటి",
  "ట్రైలర్"
];

function inferCategory(text: string, fallback: TrendingCategory): TrendingCategory {
  const normalized = text.toLowerCase();
  return MOVIE_KEYWORDS.some((keyword) => normalized.includes(keyword))
    ? "movies"
    : fallback;
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

export async function syncFeeds() {
  const supabase = createSupabaseAdminClient();

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const feed of FEED_SOURCES) {
    try {
      const items = await fetchFeedItems(feed.url);

      for (const item of items.slice(0, 12)) {
        if (!isWithinLast24Hours(item.publishedAt)) {
          skipped += 1;
          continue;
        }

        const category = inferCategory(
          `${item.title} ${item.summary} ${item.contentBody}`,
          feed.categoryHint
        );

        const embedding = await createEmbedding(
          `${item.title}\n${item.summary}\n${item.contentBody}`.slice(0, 7000)
        );

        const similarityCheck = await supabase.rpc("match_trending_topics", {
          match_count: 1,
          query_category: category,
          query_embedding: embedding,
          similarity_threshold: 0.92
        });

        if (similarityCheck.error) {
          throw similarityCheck.error;
        }

        if ((similarityCheck.data ?? []).length > 0) {
          skipped += 1;
          continue;
        }

        const viralityScore = calculateViralityScore({
          publishedAt: item.publishedAt,
          source: feed.source,
          summary: item.summary
        });

        const insertResult = await supabase.from("trending_topics").insert({
          category,
          title: item.title,
          summary: item.summary,
          content_body: item.contentBody,
          embedding,
          virality_score: viralityScore,
          metadata: {
            source: feed.source,
            feedLabel: feed.label,
            link: item.link,
            publishedAt: item.publishedAt
          }
        });

        if (insertResult.error) {
          throw insertResult.error;
        }

        inserted += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      errors.push(`${feed.source}: ${message}`);
    }
  }

  return { inserted, skipped, errors };
}
