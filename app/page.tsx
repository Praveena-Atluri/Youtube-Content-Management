import { DashboardShell } from "@/components/dashboard-shell";
import { getStories } from "@/lib/trending-topics";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
    storyId?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category =
    params.category === "movies" || params.category === "news"
      ? params.category
      : "news";

  const stories = await getStories(category);
  const selectedStory =
    stories.find((story) => story.id === params.storyId) ?? stories[0] ?? null;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <DashboardShell
        category={category}
        stories={stories}
        selectedStory={selectedStory}
      />
    </main>
  );
}
