import { createSupabaseAdminClient } from "@/lib/supabase";
import type { CategoryFilter, FeedDefinition, TrendingCategory } from "@/lib/types";

export const DEFAULT_FEED_SOURCES: FeedDefinition[] = [
  {
    source: "NTV",
    label: "NTV Telugu",
    url: "https://ntvtelugu.com/feed",
    categoryHint: "news",
  },
  {
    source: "V6",
    label: "V6 Velugu",
    url: "https://www.v6velugu.com/feed",
    categoryHint: "news",
  },
  {
    source: "Mana Telangana",
    label: "Mana Telangana",
    url: "https://www.manatelangana.news/feed",
    categoryHint: "news",
  },
  {
    source: "Google News Telugu",
    label: "Google News",
    url: "https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te",
    categoryHint: "news",
  },
  {
    source: "Siasat",
    label: "Siasat",
    url: "https://www.siasat.com/feed/",
    categoryHint: "news",
  },
  {
    source: "Sakshi",
    label: "Sakshi",
    url: "https://www.sakshi.com/rss.xml",
    categoryHint: "news",
  },
  {
    source: "NT News",
    label: "NT News",
    url: "https://www.ntnews.com/feed",
    categoryHint: "news",
  },
  {
    source: "Andhrajyothy",
    label: "Andhrajyothy",
    url: "https://www.andhrajyothy.com/rss/headlines.xml",
    categoryHint: "news",
  },
  {
    source: "Eenadu",
    label: "Eenadu",
    url: "https://www.eenadu.net/rss/latestnews.xml",
    categoryHint: "news",
  },
  {
    source: "Lux",
    label: "Lux Camera",
    url: "https://lux.camera/rss",
    categoryHint: "tech",
  },
  {
    source: "TechRadar",
    label: "TechRadar",
    url: "https://www.techradar.com/rss",
    categoryHint: "tech",
  },
  {
    source: "404 Media",
    label: "404 Media",
    url: "https://www.404media.co/rss/",
    categoryHint: "tech",
  },
  {
    source: "Ars Technica",
    label: "Ars Technica",
    url: "https://arstechnica.com/feed/",
    categoryHint: "tech",
  },
  {
    source: "TechCrunch",
    label: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    categoryHint: "tech",
  },
  {
    source: "Wired",
    label: "Wired",
    url: "https://www.wired.com/feed",
    categoryHint: "tech"
  },
  {
    source: "ABP Live Telugu",
    label: "ABP Live - Spirituality",
    url: "https://telugu.abplive.com/spirituality/feed",
    categoryHint: "devotional"
  },
  {
    source: "TV9 Telugu",
    label: "TV9 Telugu - Spiritual",
    url: "https://tv9telugu.com/spiritual/feed",
    categoryHint: "devotional"
  },
  {
    source: "Bhakthi TV",
    label: "Bhakthi TV",
    url: "https://www.bhakthitv.in/feed",
    categoryHint: "devotional"
  },
  {
    source: "Go Spiritual India",
    label: "Go Spiritual India",
    url: "https://gospiritualindia.in/tag/spiritual-india/feed/",
    categoryHint: "devotional"
  },
  {
    source: "NT News",
    label: "NT News - Devotional",
    url: "https://www.ntnews.com/devotional/feed",
    categoryHint: "devotional"
  },
  {
    source: "NTV Telugu",
    label: "NTV Telugu - Bhakthi",
    url: "https://ntvtelugu.com/bhakthi/feed",
    categoryHint: "devotional"
  }
];

const CATEGORY_ORDER: TrendingCategory[] = [
  "news",
  "movies",
  "sports",
  "business",
  "devotional",
  "tech"
];

type FeedSourceRow = {
  source: string;
  label: string;
  url: string;
  category_hint: string;
};

export async function getActiveCategories(): Promise<CategoryFilter[]> {
  const supabase = createSupabaseAdminClient();
  const response = await supabase
    .from("feed_sources")
    .select("category_hint")
    .eq("active", true);

  if (response.error || !response.data) {
    return ["all", "news"];
  }

  const hints = [...new Set(response.data.map((r) => r.category_hint as string))];
  const valid = CATEGORY_ORDER.filter((c) => hints.includes(c));

  return ["all", ...valid] as CategoryFilter[];
}

export async function getActiveFeedSources(): Promise<FeedDefinition[]> {
  const supabase = createSupabaseAdminClient();
  const response = await supabase
    .from("feed_sources")
    .select("source, label, url, category_hint")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error) {
    console.error("Failed to load feed sources from Supabase:", response.error);
    return DEFAULT_FEED_SOURCES;
  }

  const rows = (response.data ?? []) as FeedSourceRow[];
  if (rows.length === 0) {
    return DEFAULT_FEED_SOURCES;
  }

  return rows.map((row) => ({
    source: row.source,
    label: row.label,
    url: row.url,
    categoryHint:
      (CATEGORY_ORDER as string[]).includes(row.category_hint)
        ? (row.category_hint as TrendingCategory)
        : "news"
  }));
}
