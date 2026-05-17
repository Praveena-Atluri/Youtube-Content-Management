"use client";

import { formatDistanceToNowStrict } from "@/lib/date";
import { categoryLabel } from "@/lib/types";
import type { CategoryFilter, StorySortOption, StoryRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type StoryListProps = {
  category: CategoryFilter;
  sort: StorySortOption;
  stories: StoryRecord[];
  disabled?: boolean;
  selectedStoryId: string | null;
  onSelectStory: (storyId: string) => void;
};

export function StoryList({
  category,
  sort,
  stories,
  disabled = false,
  selectedStoryId,
  onSelectStory
}: StoryListProps) {
  const heading = category === "all" ? "All Stories" : categoryLabel(category);
  const sortLabel =
    sort === "publishedAt"
      ? "published date"
      : sort === "syncedAt"
      ? "synced time"
      : "virality score";

  return (
    <Card className="rounded-[1.75rem] bg-card/90 dark:bg-card shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl font-black">{heading}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sorted by {sortLabel}.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea key={`${category}-${sort}`} className="h-[70vh] pr-4">
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
                disabled={disabled}
                onClick={() => onSelectStory(story.id)}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition hover:border-primary/40 hover:bg-secondary/30",
                  disabled && "cursor-wait opacity-70",
                  selectedStoryId === story.id
                    ? "border-primary/60 bg-primary/10 shadow-sm"
                    : "bg-card/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {story.metadata.feedLabel}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {categoryLabel(story.category)}
                    </Badge>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>
                      Published{" "}
                      {story.metadata.publishedAt
                        ? formatDistanceToNowStrict(story.metadata.publishedAt)
                        : "N/A"}
                    </div>
                    <div>
                      Added {formatDistanceToNowStrict(story.inserted_at)}
                    </div>
                  </div>
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
                  <span>Virality: {Math.round(story.virality_score)}</span>
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
