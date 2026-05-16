"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RefreshCcw, Tv2, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { VideoRecord, VideoSortOption } from "@/lib/trending-videos";
import { YOUTUBE_CHANNELS } from "@/lib/youtube-channels";
import { ThemeToggle } from "@/components/theme-toggle";
import { VideoList } from "@/components/video-list";
import { VideoGenerator } from "@/components/video-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VideoShellProps = {
  videos: VideoRecord[];
  sort: VideoSortOption;
  channelId: string;
};

const SORT_LABELS: Record<VideoSortOption, string> = {
  virality: "Virality Score",
  publishedAt: "Published",
  syncedAt: "Synced Time",
  views: "View Count",
};

export function VideoShell({ videos, sort, channelId }: VideoShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(
    videos[0]?.id ?? null
  );

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) ?? videos[0] ?? null;
  const selectedChannel = YOUTUBE_CHANNELS.find((c) => c.channelId === channelId) ?? null;

  const updateParams = (nextSort: VideoSortOption, nextChannelId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);
    if (nextChannelId) {
      params.set("channel", nextChannelId);
    } else {
      params.delete("channel");
    }
    router.push(`/videos?${params.toString()}`);
  };

  const handleSync = () => {
    startSyncTransition(async () => {
      setSyncMessage(null);
      const response = await fetch("/api/sync-videos", { method: "POST" });
      const payload = (await response.json()) as {
        inserted?: number;
        updated?: number;
        deleted?: number;
        error?: string;
      };

      if (!response.ok) {
        setSyncMessage(payload.error ?? "Sync failed.");
        return;
      }

      setSyncMessage(
        `${payload.inserted ?? 0} new, ${payload.updated ?? 0} updated, ${payload.deleted ?? 0} removed.`
      );
      router.refresh();
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[300px_1fr_380px]">
      {/* Sidebar */}
      <aside className="rounded-[1.75rem] border bg-card/90 dark:bg-card p-4 shadow-sm backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-2xl border bg-card px-3 py-1.5 text-sm font-semibold transition hover:bg-secondary/50"
          >
            ← Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary/70 p-4">
          <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 dark:text-red-400">
            <Youtube className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Trending Videos</h1>
            <p className="text-sm text-muted-foreground">
              Latest from Telugu news channels.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Channel
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Select
                value={channelId || "all"}
                onValueChange={(val) =>
                  updateParams(sort, val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border bg-card">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {YOUTUBE_CHANNELS.map((ch) => (
                    <SelectItem key={ch.channelId} value={ch.channelId}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Sort By
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Select
                value={sort}
                onValueChange={(val) =>
                  updateParams(val as VideoSortOption, channelId)
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virality">Virality Score</SelectItem>
                  <SelectItem value="views">View Count</SelectItem>
                  <SelectItem value="publishedAt">Published</SelectItem>
                  <SelectItem value="syncedAt">Synced Time</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-gradient-to-br from-red-100 via-card to-rose-50 dark:from-red-900/30 dark:via-card dark:to-rose-900/20 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <Badge className="rounded-full bg-card text-foreground hover:bg-card">
                {selectedChannel ? selectedChannel.name : "All Channels"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Videos from the past 72 hours sorted by {SORT_LABELS[sort].toLowerCase()}.
              </p>
              <Button
                className="h-11 w-full rounded-2xl"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCcw className="mr-2 size-4" />
                {isSyncing ? "Syncing..." : "Refresh videos"}
              </Button>
              {syncMessage ? (
                <p className="text-sm text-muted-foreground">{syncMessage}</p>
              ) : null}
              {isSyncing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Fetching latest videos...
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <div className="rounded-3xl border bg-card/90 dark:bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tv2 className="size-4 text-primary" />
                Videos found
              </div>
              <p className="mt-2 text-3xl font-black">{videos.length}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Video grid */}
      <section className="min-w-0">
        <ScrollArea className="h-[calc(100vh-2rem)]">
          <div className="pb-4 pr-1">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{videos.length} videos</span>
              <span>·</span>
              <span>sorted by {SORT_LABELS[sort].toLowerCase()}</span>
              {selectedChannel && (
                <>
                  <span>·</span>
                  <span>{selectedChannel.name}</span>
                </>
              )}
            </div>
            <VideoList
              videos={videos}
              selectedVideoId={selectedVideo?.id ?? null}
              onSelectVideo={setSelectedVideoId}
            />
          </div>
        </ScrollArea>
      </section>

      {/* Content Studio */}
      <VideoGenerator video={selectedVideo} />
    </div>
  );
}
