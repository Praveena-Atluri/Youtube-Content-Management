export type TrendingCategory = "news" | "movies" | "tech";

export type CategoryFilter = TrendingCategory | "all";
export type StorySortOption = "virality" | "publishedAt" | "syncedAt";

export type StoryRecord = {
  id: string;
  category: TrendingCategory;
  title: string;
  summary: string;
  content_body: string;
  virality_score: number;
  metadata: {
    source: string;
    feedLabel: string;
    link?: string;
    publishedAt?: string;
  };
  inserted_at: string;
};

export type FeedDefinition = {
  categoryHint: TrendingCategory;
  label: string;
  source: string;
  url: string;
};

export const CATEGORY_OPTIONS: Array<{
  label: string;
  value: CategoryFilter;
}> = [
  { label: "All", value: "all" },
  { label: "News", value: "news" },
  { label: "Movies", value: "movies" },
  { label: "Tech", value: "tech" }
];

export function getCategoryLabel(category: CategoryFilter) {
  return CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}
