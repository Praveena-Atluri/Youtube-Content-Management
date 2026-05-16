import { DashboardShell } from "@/components/dashboard-shell";
import { getActiveCategories } from "@/lib/feed-sources";
import { getStories } from "@/lib/trending-topics";
import type { CategoryFilter, StorySortOption } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoriesPageProps = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    storyId?: string;
  }>;
};

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
      : params.sort === "syncedAt"
      ? "syncedAt"
      : "virality";

  const stories = await getStories(category, sort);
  const selectedStory =
    stories.find((story) => story.id === params.storyId) ?? stories[0] ?? null;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <DashboardShell
        activeCategories={activeCategories}
        category={category}
        sort={sort}
        stories={stories}
        selectedStory={selectedStory}
      />
    </main>
  );
}
