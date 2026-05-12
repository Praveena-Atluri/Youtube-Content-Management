import Parser from "rss-parser";

type FeedItem = {
  "content:encoded"?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  link?: string;
  pubDate?: string;
  summary?: string;
  title?: string;
};

const parser = new Parser({
  timeout: 15000
});

export type ParsedFeedItem = {
  title: string;
  summary: string;
  contentBody: string;
  link: string;
  publishedAt: string;
};

export async function fetchFeedItems(url: string): Promise<ParsedFeedItem[]> {
  const feed = await parser.parseURL(url);

  return ((feed.items ?? []) as FeedItem[])
    .map((item) => ({
      title: item.title?.trim() ?? "",
      summary:
        item.contentSnippet?.trim() ??
        item.summary?.trim() ??
        item.content?.replace(/<[^>]+>/g, " ").trim() ??
        "",
      contentBody:
        item["content:encoded"]?.toString().replace(/<[^>]+>/g, " ").trim() ??
        item.content?.replace(/<[^>]+>/g, " ").trim() ??
        item.contentSnippet?.trim() ??
        "",
      link: item.link?.trim() ?? "",
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString()
    }))
    .filter((item) => item.title && item.summary);
}
