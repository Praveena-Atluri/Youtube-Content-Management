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
  if (
    category === "movies" ||
    category === "tech" ||
    category === "sports" ||
    category === "business" ||
    category === "devotional"
  ) {
    return category;
  }

  return "news";
}

function isWithinLast24Hours(story: StoryRecord) {
  const publishedAt = story.metadata.publishedAt || story.inserted_at;
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

export async function getStories(
  category: CategoryFilter,
  sort: StorySortOption,
  sources: string[] = []
): Promise<StoryRecord[]> {
  const supabase = createSupabaseAdminClient();
  const selectedSources = new Set(sources);

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

  const filteredStories = normalizedStories.filter((story) => {
    if (!isWithinLast24Hours(story)) {
      return false;
    }

    if (category === "all") {
      return selectedSources.size === 0 || selectedSources.has(story.metadata.source);
    }

    return (
      story.category === category &&
      (selectedSources.size === 0 || selectedSources.has(story.metadata.source))
    );
  });

  filteredStories.sort((left, right) => {
    if (sort === "publishedAt") {
      const leftHasDate = Boolean(left.metadata.publishedAt);
      const rightHasDate = Boolean(right.metadata.publishedAt);
      if (leftHasDate && !rightHasDate) return -1;
      if (!leftHasDate && rightHasDate) return 1;
      const leftTime = new Date(left.metadata.publishedAt || left.inserted_at).getTime();
      const rightTime = new Date(right.metadata.publishedAt || right.inserted_at).getTime();
      return rightTime - leftTime;
    }

    if (sort === "syncedAt") {
      const syncDiff =
        new Date(right.inserted_at).getTime() - new Date(left.inserted_at).getTime();
      if (syncDiff !== 0) return syncDiff;
      return right.virality_score - left.virality_score;
    }

    if (right.virality_score !== left.virality_score) {
      return right.virality_score - left.virality_score;
    }

    return (
      new Date(right.inserted_at).getTime() - new Date(left.inserted_at).getTime()
    );
  });

  return filteredStories.slice(0, 1000);
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

  return story;
}
