import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase";
import type { StoryRecord, TrendingCategory } from "@/lib/types";

function isWithinLast24Hours(story: StoryRecord) {
  const publishedAt = story.metadata.publishedAt ?? story.inserted_at;
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

export async function getStories(category: TrendingCategory): Promise<StoryRecord[]> {
  const supabase = createSupabaseAdminClient();

  const response = await supabase
    .from("trending_topics")
    .select("id, category, title, summary, content_body, virality_score, metadata, inserted_at")
    .eq("category", category)
    .order("virality_score", { ascending: false })
    .order("inserted_at", { ascending: false })
    .limit(200);

  if (response.error) {
    console.error(response.error);
    return [];
  }

  return (response.data as StoryRecord[]).filter(isWithinLast24Hours).slice(0, 100);
}

export async function getStoryById(storyId: string): Promise<StoryRecord | null> {
  const supabase = createSupabaseAdminClient();

  const response = (await supabase
    .from("trending_topics")
    .select("id, category, title, summary, content_body, virality_score, metadata, inserted_at")
    .eq("id", storyId)
    .maybeSingle()) as PostgrestSingleResponse<StoryRecord>;

  if (response.error) {
    console.error(response.error);
    return null;
  }

  if (!response.data || !isWithinLast24Hours(response.data)) {
    return null;
  }

  return response.data;
}
