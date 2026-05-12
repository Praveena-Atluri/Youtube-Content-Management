"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, WandSparkles } from "lucide-react";

import type { GeneratedBundle, GenerationMode, StoryRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type StoryGeneratorProps = {
  story: StoryRecord | null;
};

export function StoryGenerator({ story }: StoryGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState<GeneratedBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<GenerationMode | null>(null);

  useEffect(() => {
    setBundle(null);
    setError(null);
    setActiveMode(null);
  }, [story?.id]);

  const handleGenerate = (mode: GenerationMode) => {
    if (!story) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setActiveMode(mode);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId: story.id, mode })
      });

      const payload = (await response.json()) as GeneratedBundle & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Generation failed.");
        return;
      }

      setBundle((currentBundle) => ({
        ...currentBundle,
        ...payload
      }));
    });
  };

  return (
    <Card className="rounded-[1.75rem] bg-card/90 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-black">Creator Output</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a unique story and generate separate video and text-based web story outputs with reach-focused packaging.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11 rounded-2xl"
              disabled={!story || isPending}
              onClick={() => handleGenerate("video")}
            >
              {isPending && activeMode === "video" ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 size-4" />
              )}
              {isPending && activeMode === "video"
                ? "Generating video..."
                : "Generate video script"}
            </Button>
            <Button
              className="h-11 rounded-2xl"
              variant="secondary"
              disabled={!story || isPending}
              onClick={() => handleGenerate("webStory")}
            >
              {isPending && activeMode === "webStory" ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 size-4" />
              )}
              {isPending && activeMode === "webStory"
                ? "Generating web story..."
                : "Generate web story text"}
            </Button>
          </div>
        </div>
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
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-foreground">Source URL: </span>
                  <a
                    href={story.metadata.link}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-primary underline underline-offset-4"
                  >
                    {story.metadata.link}
                  </a>
                </p>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <ScrollArea className="h-[58vh] pr-4">
              {bundle ? (
                <div className="space-y-4">
                  {bundle.video ? (
                    <>
                      <OutputCard
                        title="Video Script"
                        content={bundle.video.script}
                      />
                      <OutputCard
                        title="Video Title Suggestions"
                        content={bundle.video.suggestedTitles
                          .map((title, index) => `${index + 1}. ${title}`)
                          .join("\n")}
                      />
                      <OutputCard
                        title="Video Description"
                        content={bundle.video.description}
                      />
                      <OutputCard
                        title="Video Keywords"
                        content={bundle.video.keywords.join(", ")}
                      />
                      <OutputCard
                        title="Thumbnail Text Suggestions"
                        content={bundle.video.thumbnailTextSuggestions
                          .map((text, index) => `${index + 1}. ${text}`)
                          .join("\n")}
                      />
                    </>
                  ) : null}
                  {bundle.webStory ? (
                    <>
                      <OutputCard
                        title="Web Story Script"
                        content={bundle.webStory.script}
                      />
                      <OutputCard
                        title="Web Story Title Suggestions"
                        content={bundle.webStory.suggestedTitles
                          .map((title, index) => `${index + 1}. ${title}`)
                          .join("\n")}
                      />
                      <OutputCard
                        title="Web Story Description"
                        content={bundle.webStory.description}
                      />
                      <OutputCard
                        title="Web Story Keywords"
                        content={bundle.webStory.keywords.join(", ")}
                      />
                      <OutputCard
                        title="Web Story URL Suggestions"
                        content={bundle.webStory.urlSuggestions
                          .map((url, index) => `${index + 1}. ${url}`)
                          .join("\n")}
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
                  Use the buttons above to generate either a video script or a web story for the selected topic.
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OutputCard({
  title,
  content
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-3xl border bg-white/80 p-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      <p className="mt-3 whitespace-pre-wrap font-[var(--font-telugu)] text-sm leading-7">
        {content}
      </p>
    </div>
  );
}
