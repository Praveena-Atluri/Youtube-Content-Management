import type { TrendingCategory } from "@/lib/types";

export type TaxonomyKeywordSets = {
  crime: readonly string[];
  devotional: readonly string[];
  movies: readonly string[];
  sports: readonly string[];
};

export function containsWholeKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped.toLowerCase()}(?=$|[^\\p{L}\\p{N}])`,
    "u"
  );

  return pattern.test(text.toLowerCase());
}

export function inferTaxonomy(
  text: string,
  articleUrl: string,
  fallback: TrendingCategory,
  keywords: TaxonomyKeywordSets
): { category: TrendingCategory } {
  if (fallback !== "news") {
    return { category: fallback };
  }

  const normalized = `${text} ${articleUrl}`.toLowerCase();
  const includesAny = (values: readonly string[]) =>
    values.some((keyword) => containsWholeKeyword(normalized, keyword));

  if (includesAny(keywords.crime)) {
    return { category: "crime" };
  }

  if (includesAny(keywords.sports)) {
    return { category: "sports" };
  }

  if (includesAny(keywords.movies)) {
    return { category: "movies" };
  }

  if (includesAny(keywords.devotional)) {
    return { category: "devotional" };
  }

  return { category: "news" };
}
