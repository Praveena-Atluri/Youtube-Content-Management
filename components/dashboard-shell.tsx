"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Newspaper, RefreshCcw, Sparkles, Video } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDistanceToNowStrict } from "@/lib/date";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel
} from "@/lib/types";
import type {
  CategoryFilter,
  StoryRecord,
  StorySortOption
} from "@/lib/types";
import { StoryGenerator } from "@/components/story-generator";
import { StoryList } from "@/components/story-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type DashboardShellProps = {
  category: CategoryFilter;
  sort: StorySortOption;
  stories: StoryRecord[];
  selectedStory: StoryRecord | null;
};

export function DashboardShell({
  category,
  sort,
  stories,
  selectedStory
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigationTransition] = useTransition();
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedLabel = getCategoryLabel(category);
  const creatorHint = selectedStory
    ? "Story selected. Open a Gem on the right to generate your script."
    : "Select a story to generate video or web story scripts.";
  const lastSyncedAt = stories.reduce<string | null>((latest, story) => {
    if (!latest) {
      return story.inserted_at;
    }

    return new Date(story.inserted_at).getTime() > new Date(latest).getTime()
      ? story.inserted_at
      : latest;
  }, null);

  const updateParams = (
    nextCategory: CategoryFilter,
    nextSort?: StorySortOption,
    storyId?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", nextCategory);
    params.delete("subcategory");

    params.set("sort", nextSort ?? sort);

    if (storyId) {
      params.set("storyId", storyId);
    } else {
      params.delete("storyId");
    }

    const href = `${pathname}?${params.toString()}` as Route;
    startNavigationTransition(() => {
      router.push(href);
    });
  };

  const handleSync = () => {
    startSyncTransition(async () => {
      setSyncMessage(null);

      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as {
        inserted?: number;
        skipped?: number;
        deleted?: number;
        error?: string;
      };

      if (!response.ok) {
        setSyncMessage(payload.error ?? "Sync failed.");
        return;
      }

      setSyncMessage(
        `Sync complete: ${payload.inserted ?? 0} new stories, ${payload.skipped ?? 0} duplicate URLs skipped, ${payload.deleted ?? 0} stale stories deleted.`
      );
      router.refresh();
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-[1.75rem] border bg-card/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/70 p-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Media Radar</h1>
            <p className="text-sm text-muted-foreground">
              Track fresh stories across news, movies, and tech.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Select
                value={category}
                onValueChange={(value: CategoryFilter) =>
                  updateParams(value, sort)
                }
                disabled={isNavigating}
              >
                <SelectTrigger className="h-12 rounded-2xl border bg-card">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                onValueChange={(value: StorySortOption) =>
                  updateParams(category, value)
                }
                disabled={isNavigating}
              >
                <SelectTrigger className="h-12 rounded-2xl border bg-card">
                  <SelectValue placeholder="Choose sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virality">Virality Score</SelectItem>
                  <SelectItem value="publishedAt">Published</SelectItem>
                  <SelectItem value="syncedAt">Synced Time</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-gradient-to-br from-amber-100 via-white to-emerald-100 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <Badge className="rounded-full bg-card text-foreground hover:bg-card">
                {selectedLabel}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Latest stories from the past 24 hours, sorted and ready to script.
              </p>
              <Button
                className="h-11 w-full rounded-2xl"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCcw className="mr-2 size-4" />
                {isSyncing ? "Syncing feeds..." : "Refresh feeds"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Last refreshed{" "}
                {lastSyncedAt
                  ? formatDistanceToNowStrict(lastSyncedAt)
                  : "not available"}
              </p>
              {syncMessage ? (
                <p className="text-sm text-muted-foreground">{syncMessage}</p>
              ) : null}
              {isNavigating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Updating stories...
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <div className="rounded-3xl border bg-card/90 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Newspaper className="size-4 text-primary" />
                Unique stories
              </div>
              <p className="mt-2 text-3xl font-black">{stories.length}</p>
            </div>

            <div className="rounded-3xl border bg-card/90 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Video className="size-4 text-primary" />
                Creator Status
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {creatorHint}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <StoryList
          category={category}
          sort={sort}
          stories={stories}
          disabled={isNavigating}
          selectedStoryId={selectedStory?.id ?? null}
          onSelectStory={(storyId) => updateParams(category, sort, storyId)}
        />
        <StoryGenerator story={selectedStory} />
      </section>
    </div>
  );
}
