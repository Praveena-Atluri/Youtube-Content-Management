"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Info, WandSparkles } from "lucide-react";

import type { StoryRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StoryGeneratorProps = {
  story: StoryRecord | null;
  isLoading?: boolean;
};

const VIDEO_GEM_URL =
  "https://gemini.google.com/gem/11Ioos1xTyhRpbb7RaXdtVg8vkMKTyflL?usp=sharing";

const WEB_STORY_GEM_URL =
  "https://gemini.google.com/gem/1E9Yx106pdwaHmROt1SBEeLiWutI7owIU?usp=sharing";

function isGoogleNewsUrl(url?: string) {
  if (!url) return false;
  try {
    return new URL(url).hostname === "news.google.com";
  } catch {
    return false;
  }
}

const LOADING_HINTS = [
  "Reading the story…",
  "Analysing key details…",
  "Setting up your studio…",
  "Almost ready…",
];

export function StoryGenerator({ story, isLoading = false }: StoryGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setHintIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % LOADING_HINTS.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading]);
  const isGoogleNews = isGoogleNewsUrl(story?.metadata.link);
  const gemHint = isGoogleNews
    ? "Google News link won't work directly in Gem. Open the link first, let it redirect, then copy and paste the final URL in the Gem to generate the script."
    : "Ready for the story? Paste the copied URL into the Gem to start generating.";
  const canCopySourceUrl = Boolean(story?.metadata.link && !isGoogleNews);

  const handleOpenVideoGem = () => {
    if (!story) {
      return;
    }

    window.open(VIDEO_GEM_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenWebStoryGem = () => {
    if (!story) {
      return;
    }

    window.open(WEB_STORY_GEM_URL, "_blank", "noopener,noreferrer");
  };

  const handleCopySourceUrl = async () => {
    if (!story?.metadata.link || !canCopySourceUrl) {
      return;
    }

    await navigator.clipboard.writeText(story.metadata.link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-[1.75rem] bg-card/90 dark:bg-card shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-5">
        <CardTitle className="text-2xl font-black">Content Studio</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a Gem to generate a script for this story.
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed bg-muted/40 px-8 py-12">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-16 animate-ping rounded-full bg-primary/20" />
              <div className="absolute size-12 animate-pulse rounded-full bg-primary/30" />
              <WandSparkles className="relative size-7 animate-bounce text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground">{LOADING_HINTS[hintIndex]}</p>
              <p className="text-xs text-muted-foreground">Preparing your content studio</p>
            </div>
            <div className="flex gap-1.5">
              <span className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
              <span className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
              <span className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
            </div>
          </div>
        ) : !story ? (
          <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
            Pick a story from the left panel to generate a script pack.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full">{story.metadata.feedLabel}</Badge>
                <Badge variant="secondary" className="rounded-full">
                  Virality {story.virality_score.toFixed(1)}
                </Badge>
              </div>
              <h2 className="mt-3 text-xl font-extrabold">{story.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{story.content_body || story.summary}</p>
              {story.metadata.link ? (
                <div className="mt-3 flex flex-wrap items-start gap-2 text-sm">
                  <span className="font-semibold text-foreground">Source URL:</span>
                  <a
                    href={story.metadata.link}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 break-all text-primary underline underline-offset-4"
                  >
                    {isGoogleNews
                      ? "Click here to open source article →"
                      : story.metadata.link}
                  </a>
                  {canCopySourceUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl px-3"
                      onClick={handleCopySourceUrl}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border bg-card p-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-11 rounded-2xl"
                  onClick={handleOpenVideoGem}
                >
                  <WandSparkles className="mr-2 size-4" />
                  Generate Video Script
                </Button>
                <Button
                  className="h-11 rounded-2xl"
                  variant="secondary"
                  onClick={handleOpenWebStoryGem}
                >
                  <WandSparkles className="mr-2 size-4" />
                  Generate Web Story Script
                </Button>
              </div>
            </div>

            {isGoogleNews ? (
              <div className="flex gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700/50 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {gemHint}
                </p>
              </div>
            ) : (
              <div className="flex gap-3 rounded-3xl border bg-muted/40 p-5">
                <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{gemHint}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
