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
  },
  {
    source: "News18 Telugu",
    label: "News18 Telugu - Life Style",
    url: "https://telugu.news18.com/commonfeeds/v1/tel/rss/life-style.xml",
    categoryHint: "health"
  },
  {
    source: "Times Now Telugu",
    label: "Times Now Telugu - Life Style",
    url: "https://telugu.timesnownews.com/feeds/gns-te-lifestyle.xml",
    categoryHint: "health"
  },
  {
    source: "Boldsky Telugu",
    label: "Boldsky Telugu - Life Style",
    url: "https://telugu.boldsky.com/rss/feeds/telugu-health-fb.xml",
    categoryHint: "health"
  },
  {
    source: "News Velugu",
    label: "News Velugu - Life Style",
    url: "https://newsvelugu.com/category/health/feed/",
    categoryHint: "health"
  },
  {
    source: "OneIndia Telugu",
    label: "OneIndia Telugu - Life Style",
    url: "https://telugu.oneindia.com/rss/feeds/telugu-health-fb.xml",
    categoryHint: "health"
  },
  {
    source: "NT News",
    label: "NT News - Life Style",
    url: "https://www.ntnews.com/health/feed",
    categoryHint: "health"
  },
  {
    source: "The Hindu",
    label: "The Hindu - Life Style",
    url: "https://www.thehindu.com/sci-tech/health/feeder/default.rss",
    categoryHint: "health"
  },
  {
    source: "Indian Express",
    label: "Indian Express - Life Style",
    url: "https://indianexpress.com/section/health-wellness/feed/",
    categoryHint: "health"
  },
  {
    source: "News18 English",
    label: "News18 English - Life Style",
    url: "https://www.news18.com/commonfeeds/v1/eng/rss/lifestyle/health-and-fitness.xml",
    categoryHint: "health"
  },
  {
    source: "OnlyMyHealth",
    label: "OnlyMyHealth - Life Style",
    url: "https://www.onlymyhealth.com/rss/health/latest/latestarticle_en.xml",
    categoryHint: "health"
  },
  {
    source: "Health Dialogues",
    label: "Health Dialogues - Life Style",
    url: "https://health.medicaldialogues.in/feed",
    categoryHint: "health"
  },
  {
    source: "ET HealthWorld",
    label: "ET HealthWorld - Life Style",
    url: "https://health.economictimes.indiatimes.com/rss/topstories",
    categoryHint: "health"
  },
  {
    source: "Medical Xpress",
    label: "Medical Xpress - Life Style",
    url: "https://medicalxpress.com/rss-feed/",
    categoryHint: "health"
  },
  {
    source: "WHO",
    label: "WHO - Life Style",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    categoryHint: "health"
  },
  {
    source: "TV9 Telugu",
    label: "TV9 Telugu - Life Style",
    url: "https://tv9telugu.com/health/feed",
    categoryHint: "health"
  },
  {
    source: "NTV Telugu",
    label: "NTV Telugu - Life Style",
    url: "https://ntvtelugu.com/health/feed",
    categoryHint: "health"
  }
];

const CATEGORY_ORDER: TrendingCategory[] = [
  "news",
  "movies",
  "sports",
  "business",
  "health",
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
