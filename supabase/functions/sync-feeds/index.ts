import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const DEFAULT_FEEDS = [
  ["NTV", "NTV Telugu", "https://ntvtelugu.com/feed", "news"],
  ["V6", "V6 Velugu", "https://www.v6velugu.com/feed", "news"],
  ["Mana Telangana", "Mana Telangana", "https://www.manatelangana.news/feed", "news"],
  ["Google News Telugu", "Google News Telugu", "https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te", "news"],
  ["Siasat", "Siasat", "https://www.siasat.com/feed/", "news"],
  ["Sakshi", "Sakshi", "https://www.sakshi.com/rss.xml", "news"],
  ["NT News", "NT News", "https://www.ntnews.com/feed", "news"],
  ["Andhrajyothy", "Andhrajyothy", "https://www.andhrajyothy.com/rss/headlines.xml", "news"],
  ["Eenadu", "Eenadu", "https://www.eenadu.net/rss/latestnews.xml", "news"],
  ["Lux", "Lux Camera", "https://lux.camera/rss", "tech"],
  ["TechRadar", "TechRadar", "https://www.techradar.com/rss", "tech"],
  ["404 Media", "404 Media", "https://www.404media.co/rss/", "tech"],
  ["Ars Technica", "Ars Technica", "https://arstechnica.com/feed/", "tech"],
  ["TechCrunch", "TechCrunch", "https://techcrunch.com/feed/", "tech"],
  ["Wired", "Wired", "https://www.wired.com/feed", "tech"]
] as const;

const DEFAULT_MOVIE_KEYWORDS = [
  "tollywood",
  "telugu cinema",
  "telugu movie",
  "telugu film",
  "mahesh babu",
  "prabhas",
  "ntr",
  "allu arjun",
  "pawan kalyan",
  "chiranjeevi",
  "bollywood",
  "hollywood",
  "kollywood",
  "mollywood",
  "pan india",
  "hindi film",
  "tamil film",
  "malayalam film",
  "movie",
  "film",
  "cinema",
  "actor",
  "actress",
  "director",
  "producer",
  "box office",
  "teaser",
  "trailer",
  "review",
  "song launch",
  "ott",
  "సినిమా",
  "టాలీవుడ్",
  "హీరో",
  "హీరోయిన్",
  "దర్శకుడు",
  "నిర్మాత",
  "ట్రైలర్",
  "టీజర్",
  "ఓటిటి"
] as const;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function isGoogleNewsUrl(url: string) {
  try {
    return new URL(url).hostname === "news.google.com";
  } catch {
    return false;
  }
}

const INVALID_ARTIFACT_HOSTS = [
  "googleusercontent.com",
  "gstatic.com",
  "google.com",
  "www.google.com",
  "google-analytics.com",
  "www.google-analytics.com",
  "googletagmanager.com",
  "www.googletagmanager.com",
  "doubleclick.net",
  "www.doubleclick.net"
] as const;

function isLikelyArticleUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !INVALID_ARTIFACT_HOSTS.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    ) && host !== "news.google.com";
  } catch {
    return false;
  }
}

function canonicalizeArticleUrl(url: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "gclid",
      "fbclid",
      "oc",
      "gaa_at",
      "ga_source"
    ];

    for (const key of trackingParams) {
      parsed.searchParams.delete(key);
    }

    const sortedParams = [...parsed.searchParams.entries()].sort(([left], [right]) =>
      left.localeCompare(right)
    );
    parsed.search = "";
    for (const [key, value] of sortedParams) {
      parsed.searchParams.append(key, value);
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function getMovieKeywords() {
  const configuredKeywords = (Deno.env.get("MOVIE_KEYWORDS") ?? "")
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return configuredKeywords.length > 0
    ? configuredKeywords
    : [...DEFAULT_MOVIE_KEYWORDS];
}

async function getActiveFeedSources() {
  const response = await supabase
    .from("feed_sources")
    .select("source, label, url, category_hint")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error || (response.data ?? []).length === 0) {
    return DEFAULT_FEEDS;
  }

  return response.data.map((row) => [
    row.source,
    row.label,
    row.url,
    row.category_hint === "tech" || row.category_hint === "movies"
      ? row.category_hint
      : "news"
  ]) as Array<[string, string, string, "news" | "movies" | "tech"]>;
}

async function decodeGoogleNewsBatchExecute(id: string) {
  const requestPayload =
    '[[["Fbv4je","[\\"garturlreq\\",[[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +
    id +
    '\\"]",null,"generic"]]]';

  const response = await fetch(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        Referrer: "https://news.google.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      body: `f.req=${encodeURIComponent(requestPayload)}`
    }
  );

  const responseText = await response.text();
  const header = '[\\"garturlres\\",\\"';
  const footer = '\\",';

  if (!responseText.includes(header)) {
    return "";
  }

  const start = responseText.substring(responseText.indexOf(header) + header.length);
  if (!start.includes(footer)) {
    return "";
  }

  return start.substring(0, start.indexOf(footer));
}

async function decodeGoogleNewsUrl(url: string) {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split("/");
  const articleId = pathParts.at(-1);

  if (pathParts.at(-2) !== "articles" || !articleId) {
    return "";
  }

  let decoded = atob(articleId.replace(/-/g, "+").replace(/_/g, "/"));
  const prefix = String.fromCharCode(0x08, 0x13, 0x22);
  if (decoded.startsWith(prefix)) {
    decoded = decoded.slice(prefix.length);
  }

  const suffix = String.fromCharCode(0xd2, 0x01, 0x00);
  if (decoded.endsWith(suffix)) {
    decoded = decoded.slice(0, -suffix.length);
  }

  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  const len = bytes.at(0);
  if (len === undefined) {
    return "";
  }

  decoded = len >= 0x80 ? decoded.substring(2, len + 2) : decoded.substring(1, len + 1);

  if (decoded.startsWith("AU_yqL")) {
    return decodeGoogleNewsBatchExecute(articleId);
  }

  return decoded.startsWith("http://") || decoded.startsWith("https://") ? decoded : "";
}

async function resolveArticleUrl(source: string, url: string) {
  if (!url || source !== "Google News Telugu" || !isGoogleNewsUrl(url)) {
    return url;
  }

  try {
    const decodedUrl = await decodeGoogleNewsUrl(url);
    if (decodedUrl && isLikelyArticleUrl(decodedUrl)) {
      return decodedUrl;
    }

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    return isLikelyArticleUrl(response.url) ? response.url : url;
  } catch {
    return url;
  }
}

async function parseFeed(url: string) {
  const response = await fetch(url);
  const xml = await response.text();
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const items = [...(document?.querySelectorAll("item") ?? [])];

  return items.slice(0, 30).map((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const descriptionHtml = item.querySelector("description")?.textContent ?? "";
    const summary =
      descriptionHtml.replace(/<[^>]+>/g, " ").trim() ?? "";
    const encoded =
      item.getElementsByTagName("content:encoded")[0]?.textContent?.replace(/<[^>]+>/g, " ").trim() ?? "";
    const descriptionLinks = [...descriptionHtml.matchAll(/href="(https?:\/\/[^"]+)"/gi)]
      .map((match) => match[1])
      .filter((candidate) => isLikelyArticleUrl(candidate));
    const link = descriptionLinks[0] ?? item.querySelector("link")?.textContent?.trim() ?? "";
    const publishedAt = item.querySelector("pubDate")?.textContent?.trim() ?? new Date().toISOString();

    return {
      title,
      summary,
      contentBody: encoded || summary,
      link,
      publishedAt
    };
  }).filter((item) => item.title && item.summary);
}

function inferTaxonomy(
  text: string,
  articleUrl: string,
  fallback: string,
  movieKeywords: readonly string[]
) {
  const normalized = `${text} ${articleUrl}`.toLowerCase();
  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const containsWholeKeyword = (keyword: string) => {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegex(keyword.toLowerCase())}(?=$|[^\\p{L}\\p{N}])`,
      "u"
    );

    return pattern.test(normalized);
  };
  const includesAny = (keywords: readonly string[]) => keywords.some(containsWholeKeyword);

  if (fallback === "tech") {
    return { category: "tech" };
  }

  if (includesAny(movieKeywords)) {
    return { category: "movies" };
  }

  return { category: "news" };
}

function isWithinLast24Hours(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

Deno.serve(async () => {
  const feeds = await getActiveFeedSources();
  const movieKeywords = getMovieKeywords();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: deleteError, count: deletedCount } = await supabase
    .from("trending_topics")
    .delete({ count: "exact" })
    .lt("inserted_at", cutoff);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500
    });
  }

  const existingLinks = new Set<string>();
  const { data: existingRows, error: existingError } = await supabase
    .from("trending_topics")
    .select("metadata")
    .limit(1000);

  if (existingError) {
    return new Response(JSON.stringify({ error: existingError.message }), {
      status: 500
    });
  }

  for (const row of existingRows ?? []) {
    const link =
      row &&
      typeof row === "object" &&
      "metadata" in row &&
      row.metadata &&
      typeof row.metadata === "object" &&
      "link" in row.metadata &&
      typeof row.metadata.link === "string"
        ? canonicalizeArticleUrl(row.metadata.link)
        : "";

    if (link) {
      existingLinks.add(link);
    }
  }

  let inserted = 0;
  let skipped = 0;

  for (const [source, label, url, fallbackCategory] of feeds) {
    const items = await parseFeed(url);

    for (const item of items) {
      if (!isWithinLast24Hours(item.publishedAt)) {
        skipped += 1;
        continue;
      }

      const articleUrl = canonicalizeArticleUrl(
        await resolveArticleUrl(source, item.link)
      );

      const taxonomy = inferTaxonomy(
        `${item.title} ${item.summary} ${item.contentBody}`,
        articleUrl,
        fallbackCategory,
        movieKeywords
      );

      if (articleUrl && existingLinks.has(articleUrl)) {
        skipped += 1;
        continue;
      }

      const { error } = await supabase.from("trending_topics").insert({
        category: taxonomy.category,
        title: item.title,
        summary: item.summary,
        content_body: item.contentBody,
        virality_score: 70,
        metadata: {
          source,
          feedLabel: label,
          link: articleUrl,
          publishedAt: item.publishedAt
        }
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      if (articleUrl) {
        existingLinks.add(articleUrl);
      }

      inserted += 1;
    }
  }

  return new Response(JSON.stringify({ inserted, skipped, deleted: deletedCount ?? 0 }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
