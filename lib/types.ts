export type TrendingCategory =
  | "news"
  | "crime"
  | "movies"
  | "tech"
  | "sports"
  | "business"
  | "health"
  | "devotional";

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

export type SourceFilterOption = {
  label: string;
  source: string;
};

export function categoryLabel(value: CategoryFilter) {
  if (value === "health") {
    return "Life Style";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildCategoryOptions(activeCategories: CategoryFilter[]) {
  return activeCategories.map((value) => ({ label: categoryLabel(value), value }));
}
