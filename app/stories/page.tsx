import { DashboardShell } from "@/components/dashboard-shell";
import { getActiveCategories } from "@/lib/feed-sources";
import { getStories } from "@/lib/trending-topics";
import type {
  CategoryFilter,
  SourceFilterOption,
  StoryRecord,
  StorySortOption
} from "@/lib/types";

export const dynamic = "force-dynamic";

type StoriesPageProps = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    source?: string | string[];
    storyId?: string;
  }>;
};

function parseSources(value?: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      values
        .flatMap((entry) => entry.split(","))
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ];
}

function buildSourceOptions(stories: StoryRecord[]): SourceFilterOption[] {
  const options = new Map<string, SourceFilterOption>();

  stories.forEach((story) => {
    const source = story.metadata.source.trim();

    if (source && !options.has(source)) {
      options.set(source, {
        label: story.metadata.feedLabel || source,
        source
      });
    }
  });

  return [...options.values()].sort((left, right) =>
    left.source.localeCompare(right.source)
  );
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const [params, activeCategories] = await Promise.all([
    searchParams,
    getActiveCategories()
  ]);

  const category = activeCategories.includes(params.category as CategoryFilter)
    ? (params.category as CategoryFilter)
    : "all";

  const sort: StorySortOption =
    params.sort === "publishedAt"
      ? "publishedAt"
      : params.sort === "virality"
      ? "virality"
      : "syncedAt";

  const allStories = await getStories(category, sort);
  const sourceOptions = buildSourceOptions(allStories);
  const activeSourceNames = new Set(sourceOptions.map((sourceOption) => sourceOption.source));
  const selectedSources = parseSources(params.source).filter((source) =>
    activeSourceNames.has(source)
  );
  const selectedSourceNames = new Set(selectedSources);

  const stories =
    selectedSourceNames.size === 0
      ? allStories
      : allStories.filter((story) => selectedSourceNames.has(story.metadata.source));
  const selectedStory =
    stories.find((story) => story.id === params.storyId) ?? stories[0] ?? null;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <DashboardShell
        activeCategories={activeCategories}
        category={category}
        sort={sort}
        sourceOptions={sourceOptions}
        selectedSources={selectedSources}
        stories={stories}
        selectedStory={selectedStory}
      />
    </main>
  );
}
