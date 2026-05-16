const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export type VideoSearchItem = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId: string;
  channelName: string;
};

export type VideoStats = {
  videoId: string;
  viewCount: number;
  duration: string;
};

export type EnrichedVideo = VideoSearchItem & VideoStats & { viralityScore: number };

export async function fetchLatestVideos(
  channelId: string,
  channelName: string,
  apiKey: string,
  maxResults = 10
): Promise<VideoSearchItem[]> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: String(maxResults),
    key: apiKey
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search failed for channel ${channelId}: ${body}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
  };

  return (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    publishedAt: item.snippet.publishedAt,
    channelId,
    channelName
  }));
}

export async function fetchVideoStats(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, VideoStats>> {
  const params = new URLSearchParams({
    part: "contentDetails,statistics",
    id: videoIds.join(","),
    key: apiKey
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube videos.list failed: ${body}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      statistics: { viewCount?: string };
      contentDetails: { duration: string };
    }>;
  };

  const map = new Map<string, VideoStats>();
  for (const item of data.items ?? []) {
    map.set(item.id, {
      videoId: item.id,
      viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
      duration: item.contentDetails.duration
    });
  }
  return map;
}

export function calculateVideoViralityScore(input: {
  publishedAt: string;
  viewCount: number;
}): number {
  const ageInHours = Math.max(
    1,
    (Date.now() - new Date(input.publishedAt).getTime()) / 3_600_000
  );
  const freshnessBoost = Math.max(10, 100 - ageInHours * 4.5);
  // log-scale view boost, capped at 30
  const viewBoost = Math.min(Math.log10(input.viewCount + 1) * 5, 30);
  return Number((freshnessBoost + viewBoost).toFixed(1));
}

export async function fetchAndEnrichChannelVideos(
  channelId: string,
  channelName: string,
  apiKey: string
): Promise<EnrichedVideo[]> {
  const videos = await fetchLatestVideos(channelId, channelName, apiKey);
  if (videos.length === 0) return [];

  const statsMap = await fetchVideoStats(
    videos.map((v) => v.videoId),
    apiKey
  );

  return videos.map((video) => {
    const stats = statsMap.get(video.videoId) ?? { videoId: video.videoId, viewCount: 0, duration: "" };
    return {
      ...video,
      ...stats,
      viralityScore: calculateVideoViralityScore({
        publishedAt: video.publishedAt,
        viewCount: stats.viewCount
      })
    };
  });
}
