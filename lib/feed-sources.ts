import type { FeedDefinition } from "@/lib/types";

export const FEED_SOURCES: FeedDefinition[] = [
  {
    source: "NTV",
    label: "NTV Telugu",
    url: "https://ntvtelugu.com/feed",
    categoryHint: "news"
  },
  {
    source: "V6",
    label: "V6 Velugu",
    url: "https://www.v6velugu.com/feed",
    categoryHint: "news"
  },
  {
    source: "Mana Telangana",
    label: "Mana Telangana",
    url: "https://www.manatelangana.news/feed",
    categoryHint: "news"
  },
  {
    source: "Google News Telugu",
    label: "Google News Telugu",
    url: "https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te",
    categoryHint: "news"
  },
  {
    source: "Siasat",
    label: "Siasat",
    url: "https://www.siasat.com/feed/",
    categoryHint: "news"
  },
  {
    source: "Sakshi",
    label: "Sakshi",
    url: "https://www.sakshi.com/rss.xml",
    categoryHint: "news"
  },
  {
    source: "Andhrajyothy",
    label: "Andhrajyothy",
    url: "https://www.andhrajyothy.com/rss/headlines.xml",
    categoryHint: "news"
  },
  {
    source: "Eenadu",
    label: "Eenadu",
    url: "https://www.eenadu.net/rss/latestnews.xml",
    categoryHint: "news"
  },
  {
    source: "Lux",
    label: "Lux Camera",
    url: "https://lux.camera/rss",
    categoryHint: "news"
  },
  {
    source: "TechRadar",
    label: "TechRadar",
    url: "https://www.techradar.com/rss",
    categoryHint: "news"
  }
];
