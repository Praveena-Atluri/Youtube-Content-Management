"use client";

import { formatDistanceToNowStrict } from "@/lib/date";
import type { StoryRecord, TrendingCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type StoryListProps = {
  category: TrendingCategory;
  stories: StoryRecord[];
  selectedStoryId: string | null;
  onSelectStory: (storyId: string) => void;
};

export function StoryList({
  category,
  stories,
  selectedStoryId,
  onSelectStory
}: StoryListProps) {
  return (
    <Card className="rounded-[1.75rem] bg-card/90 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl font-black">
          {category === "movies" ? "Movie Trends" : "News Radar"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-3">
            {stories.length === 0 ? (
              <div className="rounded-3xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
                No stories yet. Run a feed sync to populate the dashboard.
              </div>
            ) : null}

            {stories.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() => onSelectStory(story.id)}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition hover:border-primary/40 hover:bg-secondary/30",
                  selectedStoryId === story.id
                    ? "border-primary/60 bg-primary/5 shadow-sm"
                    : "bg-white/70"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {story.metadata.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(story.inserted_at)}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-extrabold leading-snug">
                  {story.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {story.summary}
                </p>
                {story.metadata.link ? (
                  <p className="mt-2 line-clamp-1 text-xs text-primary/90">
                    {story.metadata.link}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Virality score: {story.virality_score.toFixed(1)}</span>
                  <span>{story.metadata.feedLabel}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
