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

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&zwnj;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyArticleUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (
      host === "news.google.com" ||
      host.endsWith("googleusercontent.com") ||
      host.endsWith("gstatic.com") ||
      host === "google.com" ||
      host === "www.google.com"
    ) {
      return false;
    }

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractFirstArticleUrl(html: string) {
  const anchorMatches = [
    ...html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)
  ];

  for (const match of anchorMatches) {
    const candidate = decodeHtmlEntities(match[1]);
    const anchorText = stripHtml(decodeHtmlEntities(match[2]));

    if (!isLikelyArticleUrl(candidate)) {
      continue;
    }

    if (anchorText.length >= 12) {
      return candidate;
    }
  }

  return "";
}

export async function fetchFeedItems(
  url: string,
  source?: string
): Promise<ParsedFeedItem[]> {
  const feed = await parser.parseURL(url);

  return ((feed.items ?? []) as FeedItem[])
    .map((item) => {
      const rawHtml =
        item["content:encoded"]?.toString() ?? item.content ?? item.summary ?? "";
      const extractedArticleUrl =
        source === "Google News Telugu" ? extractFirstArticleUrl(rawHtml) : "";

      return {
        title: item.title?.trim() ?? "",
        summary:
          item.contentSnippet?.trim() ?? item.summary?.trim() ?? stripHtml(rawHtml) ?? "",
        contentBody: stripHtml(rawHtml) ?? item.contentSnippet?.trim() ?? "",
        link: extractedArticleUrl || item.link?.trim() || "",
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString()
      };
    })
    .filter((item) => item.title && item.summary);
}
