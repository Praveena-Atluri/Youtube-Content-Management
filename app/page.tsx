import { DashboardShell } from "@/components/dashboard-shell";
import { getStories } from "@/lib/trending-topics";
import type { CategoryFilter, StorySortOption } from "@/lib/types";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    storyId?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const validCategories: CategoryFilter[] = ["all", "news", "movies", "tech"];
  const category = validCategories.includes(params.category as CategoryFilter)
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
        category={category}
        sort={sort}
        stories={stories}
        selectedStory={selectedStory}
      />
    </main>
  );
}
