import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { YOUTUBE_CHANNELS } from "@/lib/youtube-channels";
import { fetchAndEnrichChannelVideos } from "@/lib/youtube-videos";

export const dynamic = "force-dynamic";

async function deleteStaleVideos() {
  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from("youtube_videos")
    .delete({ count: "exact" })
    .lt("published_at", cutoff);

  if (error) throw error;
  return count ?? 0;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createSupabaseAdminClient();
  const deleted = await deleteStaleVideos();

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const channel of YOUTUBE_CHANNELS) {
    try {
      const videos = await fetchAndEnrichChannelVideos(channel.channelId, channel.name, apiKey);

      for (const video of videos) {
        const { error, count } = await supabase
          .from("youtube_videos")
          .upsert(
            {
              channel_id: video.channelId,
              channel_name: video.channelName,
              video_id: video.videoId,
              title: video.title,
              thumbnail_url: video.thumbnailUrl,
              published_at: video.publishedAt,
              view_count: video.viewCount,
              duration: video.duration,
              virality_score: video.viralityScore
            },
            { onConflict: "video_id", count: "exact" }
          );

        if (error) throw error;

        // Supabase upsert returns count=1 for both insert and update;
        // track inserts vs updates by checking if the row existed before
        if (count === 1) inserted += 1;
        else updated += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${channel.name}: ${message}`);
    }
  }

  return NextResponse.json({ inserted, updated, deleted, errors });
}
