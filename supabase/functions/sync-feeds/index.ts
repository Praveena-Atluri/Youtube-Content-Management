import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type CategoryHint = "news" | "movies" | "tech" | "sports" | "business" | "health" | "devotional";

const VALID_CATEGORY_HINTS: CategoryHint[] = [
  "news",
  "movies",
  "tech",
  "sports",
  "business",
  "health",
  "devotional"
];

const FEED_FETCH_CONCURRENCY = 20;
const ARTICLE_RESOLUTION_CONCURRENCY = 32;
const INSERT_BATCH_SIZE = 250;
const FEED_TIMEOUT_MS = 15_000;

async function mapConcurrentSettled<T, R>(
  values: readonly T[],
  concurrency: number,
  task: (value: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = { status: "fulfilled", value: await task(values[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      () => worker()
    )
  );

  return results;
}

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
  ["Wired", "Wired", "https://www.wired.com/feed", "tech"],
  ["ABP Live Telugu", "ABP Live - Spirituality", "https://telugu.abplive.com/spirituality/feed", "devotional"],
  ["TV9 Telugu", "TV9 Telugu - Spiritual", "https://tv9telugu.com/spiritual/feed", "devotional"],
  ["Bhakthi TV", "Bhakthi TV", "https://www.bhakthitv.in/feed", "devotional"],
  ["Go Spiritual India", "Go Spiritual India", "https://gospiritualindia.in/tag/spiritual-india/feed/", "devotional"],
  ["NT News", "NT News - Devotional", "https://www.ntnews.com/devotional/feed", "devotional"],
  ["NTV Telugu", "NTV Telugu - Bhakthi", "https://ntvtelugu.com/bhakthi/feed", "devotional"],
  ["News18 Telugu", "News18 Telugu - Life Style", "https://telugu.news18.com/commonfeeds/v1/tel/rss/life-style.xml", "health"],
  ["Times Now Telugu", "Times Now Telugu - Life Style", "https://telugu.timesnownews.com/feeds/gns-te-lifestyle.xml", "health"],
  ["Boldsky Telugu", "Boldsky Telugu - Life Style", "https://telugu.boldsky.com/rss/feeds/telugu-health-fb.xml", "health"],
  ["News Velugu", "News Velugu - Life Style", "https://newsvelugu.com/category/health/feed/", "health"],
  ["OneIndia Telugu", "OneIndia Telugu - Life Style", "https://telugu.oneindia.com/rss/feeds/telugu-health-fb.xml", "health"],
  ["NT News", "NT News - Life Style", "https://www.ntnews.com/health/feed", "health"],
  ["The Hindu", "The Hindu - Life Style", "https://www.thehindu.com/sci-tech/health/feeder/default.rss", "health"],
  ["Indian Express", "Indian Express - Life Style", "https://indianexpress.com/section/health-wellness/feed/", "health"],
  ["News18 English", "News18 English - Life Style", "https://www.news18.com/commonfeeds/v1/eng/rss/lifestyle/health-and-fitness.xml", "health"],
  ["OnlyMyHealth", "OnlyMyHealth - Life Style", "https://www.onlymyhealth.com/rss/health/latest/latestarticle_en.xml", "health"],
  ["Health Dialogues", "Health Dialogues - Life Style", "https://health.medicaldialogues.in/feed", "health"],
  ["ET HealthWorld", "ET HealthWorld - Life Style", "https://health.economictimes.indiatimes.com/rss/topstories", "health"],
  ["Medical Xpress", "Medical Xpress - Life Style", "https://medicalxpress.com/rss-feed/", "health"],
  ["WHO", "WHO - Life Style", "https://www.who.int/rss-feeds/news-english.xml", "health"],
  ["TV9 Telugu", "TV9 Telugu - Life Style", "https://tv9telugu.com/health/feed", "health"],
  ["NTV Telugu", "NTV Telugu - Life Style", "https://ntvtelugu.com/health/feed", "health"]
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

const DEFAULT_DEVOTIONAL_KEYWORDS = [
  "devotional",
  "spirituality",
  "spiritual",
  "temple",
  "tirumala",
  "tirupati",
  "ttd",
  "srivari",
  "darshan",
  "darshanam",
  "puja",
  "pooja",
  "bhakti",
  "pilgrimage",
  "yatra",
  "astrology",
  "horoscope",
  "zodiac",
  "panchangam",
  "vastu",
  "jyotish",
  "mantra",
  "sloka",
  "bhagavad gita",
  "ramayanam",
  "mahabharatam",
  "ఆధ్యాత్మికం",
  "ఆధ్యాత్మిక",
  "భక్తి",
  "దేవాలయం",
  "ఆలయం",
  "గుడి",
  "పూజ",
  "దర్శనం",
  "తిరుమల",
  "తిరుపతి",
  "శ్రీవారి",
  "తితిదే",
  "రాశి ఫలాలు",
  "జాతకం",
  "పంచాంగం",
  "వాస్తు",
  "మంత్రం",
  "శ్లోకం",
  "రామాయణం",
  "మహాభారతం"
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

function getDevotionalKeywords() {
  const configuredKeywords = (Deno.env.get("DEVOTIONAL_KEYWORDS") ?? "")
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return configuredKeywords.length > 0
    ? configuredKeywords
    : [...DEFAULT_DEVOTIONAL_KEYWORDS];
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

  return response.data.map((row) => {
    const categoryHint = VALID_CATEGORY_HINTS.includes(row.category_hint)
      ? row.category_hint
      : "news";

    return [
      row.source,
      row.label,
      row.url,
      categoryHint
    ];
  }) as Array<[string, string, string, CategoryHint]>;
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
  const response = await fetch(url, {
    headers: {
      Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "TeluguMediaContentScout/1.0"
    },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const items = [...(document?.querySelectorAll("item, entry") ?? [])];

  return items.slice(0, 30).map((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const descriptionHtml =
      item.querySelector("description, summary, content")?.textContent ?? "";
    const summary =
      descriptionHtml.replace(/<[^>]+>/g, " ").trim() ?? "";
    const encoded =
      item.getElementsByTagName("content:encoded")[0]?.textContent?.replace(/<[^>]+>/g, " ").trim() ?? "";
    const descriptionLinks = [...descriptionHtml.matchAll(/href="(https?:\/\/[^"]+)"/gi)]
      .map((match) => match[1])
      .filter((candidate) => isLikelyArticleUrl(candidate));
    const linkElement = item.querySelector("link");
    const link = descriptionLinks[0] ??
      linkElement?.getAttribute("href")?.trim() ??
      linkElement?.textContent?.trim() ??
      "";
    const publishedAt =
      item.querySelector("pubDate, published, updated")?.textContent?.trim() ??
      new Date().toISOString();

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
  movieKeywords: readonly string[],
  devotionalKeywords: readonly string[]
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

  if (fallback === "movies") {
    return { category: "movies" };
  }

  if (fallback === "sports") {
    return { category: "sports" };
  }

  if (fallback === "business") {
    return { category: "business" };
  }

  if (fallback === "health") {
    return { category: "health" };
  }

  if (fallback === "devotional") {
    return { category: "devotional" };
  }

  if (includesAny(movieKeywords)) {
    return { category: "movies" };
  }

  if (includesAny(devotionalKeywords)) {
    return { category: "devotional" };
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
  const devotionalKeywords = getDevotionalKeywords();
  const syncTime = new Date().toISOString();
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
  const existingTitles = new Set<string>();
  const { data: existingRows, error: existingError } = await supabase
    .from("trending_topics")
    .select("title, metadata")
    .limit(2000);

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

    if (typeof row.title === "string" && row.title) {
      existingTitles.add(row.title.trim().toLowerCase().replace(/\s+/g, " "));
    }
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];
  type FeedSource = readonly [string, string, string, CategoryHint];
  type UnresolvedItem = {
    feed: FeedSource;
    title: string;
    summary: string;
    contentBody: string;
    link: string;
    publishedAt: string;
  };
  type ResolvedItem = Omit<UnresolvedItem, "link"> & {
    articleUrl: string;
  };

  const feedSources = feeds as readonly FeedSource[];
  const feedResults = await mapConcurrentSettled(
    feedSources,
    FEED_FETCH_CONCURRENCY,
    async (feed) => {
      const items = await parseFeed(feed[2]);
      return items
        .filter((item) => isWithinLast24Hours(item.publishedAt))
        .map((item) => ({
          feed,
          title: item.title,
          summary: item.summary,
          contentBody: item.contentBody,
          link: item.link,
          publishedAt: item.publishedAt
        }) satisfies UnresolvedItem);
    }
  );

  const unresolved: UnresolvedItem[] = [];
  for (let index = 0; index < feedResults.length; index += 1) {
    const result = feedResults[index];
    if (result.status === "rejected") {
      errors.push(
        `${feedSources[index][1]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
      );
    } else {
      unresolved.push(...result.value);
    }
  }

  const resolutionResults = await mapConcurrentSettled(
    unresolved,
    ARTICLE_RESOLUTION_CONCURRENCY,
    async (item) => ({
      feed: item.feed,
      title: item.title,
      summary: item.summary,
      contentBody: item.contentBody,
      publishedAt: item.publishedAt,
      articleUrl: canonicalizeArticleUrl(
        await resolveArticleUrl(item.feed[0], item.link)
      )
    }) satisfies ResolvedItem
  );

  const resolved: ResolvedItem[] = [];
  for (let index = 0; index < resolutionResults.length; index += 1) {
    const result = resolutionResults[index];
    if (result.status === "rejected") {
      errors.push(
        `${unresolved[index].feed[1]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
      );
    } else {
      resolved.push(result.value);
    }
  }

  const prepared: Array<{ source: string; row: Record<string, unknown> }> = [];
  for (const item of resolved) {
    if (item.articleUrl && existingLinks.has(item.articleUrl)) {
      skipped += 1;
      continue;
    }

    const titleKey = item.title.trim().toLowerCase().replace(/\s+/g, " ");
    if (titleKey && existingTitles.has(titleKey)) {
      skipped += 1;
      continue;
    }

    const [source, label, , fallbackCategory] = item.feed;
    const taxonomy = inferTaxonomy(
      `${item.title} ${item.summary} ${item.contentBody}`,
      item.articleUrl,
      fallbackCategory,
      movieKeywords,
      devotionalKeywords
    );

    prepared.push({
      source,
      row: {
        category: taxonomy.category,
        title: item.title,
        summary: item.summary,
        content_body: item.contentBody,
        virality_score: 70,
        inserted_at: syncTime,
        metadata: {
          source,
          feedLabel: label,
          link: item.articleUrl,
          publishedAt: item.publishedAt
        }
      }
    });

    if (item.articleUrl) {
      existingLinks.add(item.articleUrl);
    }
    if (titleKey) {
      existingTitles.add(titleKey);
    }
  }

  for (let offset = 0; offset < prepared.length; offset += INSERT_BATCH_SIZE) {
    const batch = prepared.slice(offset, offset + INSERT_BATCH_SIZE);
    const { error: batchError } = await supabase
      .from("trending_topics")
      .insert(batch.map((entry) => entry.row));

    if (!batchError) {
      inserted += batch.length;
      continue;
    }

    for (const entry of batch) {
      const { error } = await supabase.from("trending_topics").insert(entry.row);
      if (!error) {
        inserted += 1;
      } else if (error.code === "23505") {
        skipped += 1;
      } else {
        errors.push(`${entry.source}: ${error.message}`);
      }
    }
  }

  return new Response(JSON.stringify({
    inserted,
    skipped,
    deleted: deletedCount ?? 0,
    errors
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
