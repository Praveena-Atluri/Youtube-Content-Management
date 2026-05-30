"use client";

import { useState } from "react";
import { BookOpenText, Clapperboard, WandSparkles } from "lucide-react";

import type { VideoRecord } from "@/lib/trending-videos";
import { formatDistanceToNowStrict } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VideoGeneratorProps = {
  video: VideoRecord | null;
};

const VIDEO_GEM_URL =
  "https://gemini.google.com/gem/11Ioos1xTyhRpbb7RaXdtVg8vkMKTyflL?usp=sharing";

const WEB_STORY_GEM_URL =
  "https://gemini.google.com/gem/1E9Yx106pdwaHmROt1SBEeLiWutI7owIU?usp=sharing";

const SHORT_STORY_GEM_URL =
  "https://gemini.google.com/gem/1vnwo5Pr-4GN_sYyjIVZSzahTDk1p5ifI?usp=sharing";

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

export function VideoGenerator({ video }: VideoGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const youtubeUrl = video
    ? `https://youtube.com/watch?v=${video.video_id}`
    : null;

  const handleCopyUrl = async () => {
    if (!youtubeUrl) return;
    await navigator.clipboard.writeText(youtubeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-[1.75rem] bg-card/90 dark:bg-card shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-5">
        <CardTitle className="text-2xl font-black">Content Studio</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a Gem to generate a script for this video.
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        {!video ? (
          <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
            Select a video from the grid to generate a script pack.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full">{video.channel_name}</Badge>
                <Badge variant="secondary" className="rounded-full">
                  Virality {Math.round(video.virality_score)}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {formatViewCount(video.view_count)}
                </Badge>
              </div>
              <h2 className="mt-3 text-xl font-extrabold leading-snug">
                {video.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Published {formatDistanceToNowStrict(video.published_at)}
              </p>
              <div className="mt-3 flex flex-wrap items-start gap-2 text-sm">
                <span className="font-semibold text-foreground">YouTube URL:</span>
                <a
                  href={youtubeUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 break-all text-primary underline underline-offset-4"
                >
                  {youtubeUrl}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-3"
                  onClick={handleCopyUrl}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-11 rounded-2xl"
                  onClick={() =>
                    window.open(VIDEO_GEM_URL, "_blank", "noopener,noreferrer")
                  }
                >
                  <Clapperboard className="mr-2 size-4" />
                  Generate Video Script
                </Button>
                <Button
                  className="h-11 rounded-2xl"
                  variant="secondary"
                  onClick={() =>
                    window.open(WEB_STORY_GEM_URL, "_blank", "noopener,noreferrer")
                  }
                >
                  <BookOpenText className="mr-2 size-4" />
                  Generate Web Story
                </Button>
                <Button
                  className="h-11 rounded-2xl"
                  variant="secondary"
                  onClick={() =>
                    window.open(SHORT_STORY_GEM_URL, "_blank", "noopener,noreferrer")
                  }
                >
                  <WandSparkles className="mr-2 size-4" />
                  Generate Short Story
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
              Paste the copied YouTube URL into the Gem to start generating your script.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
