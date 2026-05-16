"use client";

import { ExternalLink, Youtube } from "lucide-react";
import Image from "next/image";

import { formatDistanceToNowStrict } from "@/lib/date";
import type { VideoRecord } from "@/lib/trending-videos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type VideoListProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  onSelectVideo: (id: string) => void;
};

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

export function VideoList({ videos, selectedVideoId, onSelectVideo }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <Card className="rounded-[1.75rem] bg-card/90 dark:bg-card shadow-sm">
        <CardContent className="p-8">
          <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            No videos yet. Click &ldquo;Refresh videos&rdquo; to fetch the latest from YouTube channels.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pr-1">
      {videos.map((video) => (
        <button
          key={video.id}
          type="button"
          onClick={() => onSelectVideo(video.id)}
          className={cn(
            "group flex flex-col overflow-hidden rounded-3xl border text-left transition hover:border-primary/40 hover:shadow-md dark:hover:shadow-black/40",
            selectedVideoId === video.id
              ? "border-primary/60 bg-primary/10 shadow-sm"
              : "bg-card"
          )}
        >
          {video.thumbnail_url ? (
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover transition group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <Youtube className="size-8 text-muted-foreground/40" />
            </div>
          )}

          <div className="flex flex-col gap-2 p-4 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="rounded-full truncate max-w-[150px] text-xs">
                {video.channel_name}
              </Badge>
              <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>

            <h3 className="text-sm font-extrabold leading-snug line-clamp-2 flex-1">
              {video.title}
            </h3>

            <div className="mt-auto space-y-1 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{formatViewCount(video.view_count)}</span>
                <span>{formatDistanceToNowStrict(video.published_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
                Virality {Math.round(video.virality_score)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
