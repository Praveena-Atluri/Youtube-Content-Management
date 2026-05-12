"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";

import type { StoryRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StoryGeneratorProps = {
  story: StoryRecord | null;
};

const VIDEO_GEM_URL =
  "https://gemini.google.com/gem/11Ioos1xTyhRpbb7RaXdtVg8vkMKTyflL?usp=sharing";

const WEB_STORY_GEM_URL =
  "https://gemini.google.com/gem/1E9Yx106pdwaHmROt1SBEeLiWutI7owIU?usp=sharing";

export function StoryGenerator({ story }: StoryGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const gemHint =
    story?.metadata.source === "Google News Telugu"
      ? "The source URL is a Google News link — don't paste it directly. Click the source URL first, wait for the redirect, then copy and paste the final URL to generate the script."
      : "Paste the copied URL into the Gem to start generating.";
  const canCopySourceUrl = Boolean(
    story?.metadata.link && story.metadata.source !== "Google News Telugu"
  );

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
    <Card className="rounded-[1.75rem] bg-card/90 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-5">
        <CardTitle className="text-2xl font-black">Content Studio</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a Gem to generate a script for this story.
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        {!story ? (
          <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
            Pick a story from the left panel to generate a script pack.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full">{story.metadata.source}</Badge>
                <Badge variant="secondary" className="rounded-full">
                  Virality {story.virality_score.toFixed(1)}
                </Badge>
              </div>
              <h2 className="mt-3 text-xl font-extrabold">{story.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{story.summary}</p>
              {story.metadata.link ? (
                <div className="mt-3 flex flex-wrap items-start gap-2 text-sm">
                  <span className="font-semibold text-foreground">Source URL:</span>
                  <a
                    href={story.metadata.link}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 break-all text-primary underline underline-offset-4"
                  >
                    {story.metadata.link}
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

            <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
              {gemHint}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
