import { getTrendingVideos } from "@/lib/trending-videos";
import type { VideoSortOption } from "@/lib/trending-videos";
import { YOUTUBE_CHANNELS } from "@/lib/youtube-channels";
import { VideoShell } from "@/components/video-shell";

export const dynamic = "force-dynamic";

type VideosPageProps = {
  searchParams: Promise<{
    sort?: string;
    channel?: string;
  }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams;

  const validSorts: VideoSortOption[] = ["virality", "publishedAt", "syncedAt", "views"];
  const sort: VideoSortOption = validSorts.includes(params.sort as VideoSortOption)
    ? (params.sort as VideoSortOption)
    : "virality";

  const channelId = YOUTUBE_CHANNELS.some((c) => c.channelId === params.channel)
    ? (params.channel as string)
    : "";

  const videos = await getTrendingVideos(sort, channelId || undefined);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <VideoShell videos={videos} sort={sort} channelId={channelId} />
    </main>
  );
}
