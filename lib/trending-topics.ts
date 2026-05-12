import { normalizeStorySourceUrl } from "@/lib/source-url";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  CategoryFilter,
  StoryRecord,
  StorySortOption,
  TrendingCategory
} from "@/lib/types";

type RawStoryRecord = Omit<StoryRecord, "category"> & {
  category: string;
};

function normalizeCategory(category: string): TrendingCategory {
  if (category === "movies" || category === "tech") {
    return category;
  }

  return "news";
}

function isWithinLast24Hours(story: StoryRecord) {
  const publishedAt = story.metadata.publishedAt ?? story.inserted_at;
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

export async function getStories(
  category: CategoryFilter,
  sort: StorySortOption
): Promise<StoryRecord[]> {
  const supabase = createSupabaseAdminClient();

  const response = await supabase
    .from("trending_topics")
    .select(
      "id, category, title, summary, content_body, virality_score, metadata, inserted_at"
    )
    .order("virality_score", { ascending: false })
    .order("inserted_at", { ascending: false })
    .limit(1000);

  if (response.error) {
    console.error(response.error);
    return [];
  }

  const normalizedStories = (response.data as RawStoryRecord[]).map((story) => ({
    ...story,
    category: normalizeCategory(story.category)
  }));

  const stories = await Promise.all(normalizedStories.map(normalizeStorySourceUrl));
  const filteredStories = stories.filter((story) => {
    if (!isWithinLast24Hours(story)) {
      return false;
    }

    if (category === "all") {
      return true;
    }

    return story.category === category;
  });

  filteredStories.sort((left, right) => {
    if (sort === "publishedAt") {
      const leftTime = new Date(
        left.metadata.publishedAt ?? left.inserted_at
      ).getTime();
      const rightTime = new Date(
        right.metadata.publishedAt ?? right.inserted_at
      ).getTime();

      return rightTime - leftTime;
    }

    if (sort === "syncedAt") {
      return (
        new Date(right.inserted_at).getTime() - new Date(left.inserted_at).getTime()
      );
    }

    if (right.virality_score !== left.virality_score) {
      return right.virality_score - left.virality_score;
    }

    return (
      new Date(right.inserted_at).getTime() - new Date(left.inserted_at).getTime()
    );
  });

  return filteredStories.slice(0, 300);
}

export async function getStoryById(storyId: string): Promise<StoryRecord | null> {
  const supabase = createSupabaseAdminClient();

  const response = (await supabase
    .from("trending_topics")
    .select(
      "id, category, title, summary, content_body, virality_score, metadata, inserted_at"
    )
    .eq("id", storyId)
    .maybeSingle()) as PostgrestSingleResponse<RawStoryRecord>;

  if (response.error) {
    console.error(response.error);
    return null;
  }

  if (!response.data) {
    return null;
  }

  const story: StoryRecord = {
    ...response.data,
    category: normalizeCategory(response.data.category)
  };

  if (!isWithinLast24Hours(story)) {
    return null;
  }

  return normalizeStorySourceUrl(story);
}
