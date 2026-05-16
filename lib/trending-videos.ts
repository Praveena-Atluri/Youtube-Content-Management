import { createSupabaseAdminClient } from "@/lib/supabase";

export type VideoRecord = {
  id: string;
  channel_id: string;
  channel_name: string;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  view_count: number;
  duration: string | null;
  virality_score: number;
  inserted_at: string;
};

export type VideoSortOption = "virality" | "publishedAt" | "syncedAt" | "views";

const SORT_COLUMN: Record<VideoSortOption, string> = {
  virality: "virality_score",
  publishedAt: "published_at",
  syncedAt: "inserted_at",
  views: "view_count",
};

export async function getTrendingVideos(
  sort: VideoSortOption = "virality",
  channelId?: string
): Promise<VideoRecord[]> {
  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("youtube_videos")
    .select("*")
    .gte("published_at", cutoff)
    .order(SORT_COLUMN[sort], { ascending: false })
    .limit(100);

  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as VideoRecord[];
}
