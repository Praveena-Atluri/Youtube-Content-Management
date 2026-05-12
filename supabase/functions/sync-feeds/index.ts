import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const FEEDS = [
  ["NTV", "NTV Telugu", "https://ntvtelugu.com/feed"],
  ["V6", "V6 Velugu", "https://www.v6velugu.com/feed"],
  ["Mana Telangana", "Mana Telangana", "https://www.manatelangana.news/feed"],
  ["Google News Telugu", "Google News Telugu", "https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te"],
  ["Siasat", "Siasat", "https://www.siasat.com/feed/"],
  ["Sakshi", "Sakshi", "https://www.sakshi.com/rss.xml"],
  ["Andhrajyothy", "Andhrajyothy", "https://www.andhrajyothy.com/rss/headlines.xml"],
  ["Eenadu", "Eenadu", "https://www.eenadu.net/rss/latestnews.xml"],
  ["Lux", "Lux Camera", "https://lux.camera/rss"],
  ["TechRadar", "TechRadar", "https://www.techradar.com/rss"]
] as const;

const MOVIE_KEYWORDS = ["cinema", "movie", "film", "actor", "actress", "ott", "సినిమా", "హీరో", "ట్రైలర్"];

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function createEmbedding(input: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_EMBED_MODEL") ?? "text-embedding-3-small",
      input
    })
  });

  const json = await response.json();
  return json.data?.[0]?.embedding ?? [];
}

async function parseFeed(url: string) {
  const response = await fetch(url);
  const xml = await response.text();
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const items = [...(document?.querySelectorAll("item") ?? [])];

  return items.slice(0, 12).map((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const summary =
      item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, " ").trim() ?? "";
    const encoded =
      item.getElementsByTagName("content:encoded")[0]?.textContent?.replace(/<[^>]+>/g, " ").trim() ?? "";
    const link = item.querySelector("link")?.textContent?.trim() ?? "";
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

function inferCategory(text: string) {
  return MOVIE_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword))
    ? "movies"
    : "news";
}

function isWithinLast24Hours(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
}

Deno.serve(async () => {
  let inserted = 0;
  let skipped = 0;

  for (const [source, label, url] of FEEDS) {
    const items = await parseFeed(url);

    for (const item of items) {
      if (!isWithinLast24Hours(item.publishedAt)) {
        skipped += 1;
        continue;
      }

      const category = inferCategory(`${item.title} ${item.summary} ${item.contentBody}`);
      const embedding = await createEmbedding(
        `${item.title}\n${item.summary}\n${item.contentBody}`.slice(0, 7000)
      );

      const { data: similarRows, error: similarError } = await supabase.rpc("match_trending_topics", {
        match_count: 1,
        query_category: category,
        query_embedding: embedding,
        similarity_threshold: 0.92
      });

      if (similarError) {
        return new Response(JSON.stringify({ error: similarError.message }), { status: 500 });
      }

      if ((similarRows ?? []).length > 0) {
        skipped += 1;
        continue;
      }

      const { error } = await supabase.from("trending_topics").insert({
        category,
        title: item.title,
        summary: item.summary,
        content_body: item.contentBody,
        embedding,
        virality_score: 70,
        metadata: {
          source,
          feedLabel: label,
          link: item.link,
          publishedAt: item.publishedAt
        }
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      inserted += 1;
    }
  }

  return new Response(JSON.stringify({ inserted, skipped }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
