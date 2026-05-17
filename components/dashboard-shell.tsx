"use client";

import { useState, useTransition, useEffect } from "react";
import { LoaderCircle, Newspaper, RefreshCcw, Rss, Zap, Globe } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";

import { formatDistanceToNowStrict } from "@/lib/date";
import {
  buildCategoryOptions,
  categoryLabel
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
  activeCategories: CategoryFilter[];
  category: CategoryFilter;
  sort: StorySortOption;
  stories: StoryRecord[];
  selectedStory: StoryRecord | null;
};

export function DashboardShell({
  activeCategories,
  category,
  sort,
  stories,
  selectedStory
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigationTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedLabel = categoryLabel(category);
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

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as {
        inserted?: number;
        skipped?: number;
        deleted?: number;
        error?: string;
      };

      if (response.status === 409) {
        setSyncMessage("Sync already in progress, please wait.");
        return;
      }

      if (!response.ok) {
        setSyncMessage(payload.error ?? "Sync failed.");
        return;
      }

      setSyncMessage(
        `Sync complete: ${payload.inserted ?? 0} new stories, ${payload.skipped ?? 0} duplicate URLs skipped, ${payload.deleted ?? 0} stale stories deleted.`
      );
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const SYNC_STAGES = [
    { icon: Globe,      text: "Connecting to sources…",       sub: "Reaching out to your feeds" },
    { icon: Rss,        text: "Fetching latest articles…",    sub: "Pulling in fresh content" },
    { icon: Zap,        text: "Sorting by latest sync time…",  sub: "Newest arrivals first" },
    { icon: Newspaper,  text: "Organising your feed…",        sub: "Sorting and categorising" },
    { icon: RefreshCcw, text: "Almost done…",                 sub: "Putting it all together" },
  ];

  const [syncStage, setSyncStage] = useState(0);

  useEffect(() => {
    if (!isSyncing) {
      setSyncStage(0);
      return;
    }
    const interval = setInterval(() => {
      setSyncStage((s) => Math.min(s + 1, SYNC_STAGES.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [isSyncing]);

  if (isSyncing) {
    const stage = SYNC_STAGES[syncStage];
    const StageIcon = stage.icon;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-40 animate-ping rounded-full bg-primary/5" />
          <div className="absolute size-32 animate-pulse rounded-full bg-primary/10" />
          <div className="absolute size-24 animate-spin rounded-full border-4 border-primary/20 border-t-primary/60" style={{ animationDuration: "1.5s" }} />
          <div className="absolute size-16 animate-spin rounded-full border-4 border-primary/10 border-b-primary/40" style={{ animationDuration: "2.5s", animationDirection: "reverse" }} />
          <div className="relative rounded-2xl bg-primary/10 p-4">
            <StageIcon className="size-8 animate-bounce text-primary" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-2xl font-black transition-all duration-500">{stage.text}</p>
          <p className="text-sm text-muted-foreground transition-all duration-500">{stage.sub}</p>
        </div>

        <div className="flex gap-2">
          {SYNC_STAGES.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i < syncStage ? "size-2.5 bg-primary" :
                i === syncStage ? "size-3 bg-primary animate-pulse" :
                "size-2.5 bg-primary/20"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[300px_1fr]">
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
          <Image
            src="/app-icon.png"
            alt="Media Radar"
            width={72}
            height={72}
            className="rounded-2xl"
          />
          <div>
            <h1 className="text-xl font-extrabold">Media Radar</h1>
            <p className="text-sm text-muted-foreground">
              Track fresh stories across news, movies, sports, business and tech.
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
                disabled={isNavigating || isSyncing}
              >
                <SelectTrigger className="h-12 rounded-2xl border bg-card">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {buildCategoryOptions(activeCategories).map((option) => (
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
                disabled={isNavigating || isSyncing}
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

          <Card className="rounded-3xl border-0 bg-gradient-to-br from-amber-100 via-card to-emerald-100 dark:from-amber-900/30 dark:via-card dark:to-emerald-900/20 shadow-sm">
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
        <StoryGenerator story={selectedStory} isLoading={isNavigating} />
      </section>
    </div>
  );
}
