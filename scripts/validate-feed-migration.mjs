import { readFile } from "node:fs/promises";
import process from "node:process";
import Parser from "rss-parser";

const DEFAULT_MIGRATION = "supabase/migrations/schema_rss_feed_expansion.sql";
const TIMEOUT_MS = 15_000;
const DEFAULT_CONCURRENCY = 4;
const MAX_FEED_BYTES = 2_000_000;

function decodeSqlString(value) {
  return value.replaceAll("''", "'");
}

function readCandidateFeeds(sql) {
  const rowPattern = /^\s*\('((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'(https?:\/\/(?:''|[^'])*)',\s*'(news|movies|tech|sports|business|health|devotional)',\s*(true|false),\s*(\d+)\),?$/gm;
  const feeds = [];

  for (const match of sql.matchAll(rowPattern)) {
    feeds.push({
      source: decodeSqlString(match[1]),
      label: decodeSqlString(match[2]),
      url: decodeSqlString(match[3]),
      category: match[4],
      active: match[5] === "true",
      displayOrder: Number(match[6])
    });
  }

  return feeds;
}

function hasParseableDate(item) {
  const value = item.isoDate ?? item.pubDate ?? item.published ?? item.updated;
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

async function readResponseBody(response) {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return body + decoder.decode();
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_FEED_BYTES) {
      await reader.cancel();
      throw new Error(`response exceeds ${MAX_FEED_BYTES} bytes`);
    }

    body += decoder.decode(value, { stream: true });
  }
}

async function validateFeed(feed) {
  const startedAt = Date.now();

  try {
    const response = await fetch(feed.url, {
      headers: {
        accept: "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
        "user-agent": "TeluguMediaContentScout/1.0 RSS validator"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const parsed = await new Parser().parseString(body);
    const items = parsed.items ?? [];

    // A syntactically valid but temporarily empty feed is usable. It will begin
    // contributing as soon as the publisher adds an item.
    if (items.length === 0) {
      return {
        ...feed,
        ok: true,
        status: response.status,
        contentType,
        itemCount: 0,
        elapsedMs: Date.now() - startedAt
      };
    }

    if (!items.some((item) => typeof item.title === "string" && item.title.trim())) {
      throw new Error("feed contains no titled items");
    }

    if (!items.some(hasParseableDate)) {
      throw new Error("feed contains no parseable publication date");
    }

    return {
      ...feed,
      ok: true,
      status: response.status,
      contentType,
      itemCount: items.length,
      elapsedMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ...feed,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - startedAt
    };
  }
}

async function mapConcurrent(values, concurrency, task) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );

  return results;
}

const migrationPath = process.argv[2] ?? DEFAULT_MIGRATION;
const requestedLimit = Number(process.env.FEED_VALIDATION_LIMIT ?? 0);
const requestedOffset = Number(process.env.FEED_VALIDATION_OFFSET ?? 0);
const requestedConcurrency = Number(
  process.env.FEED_VALIDATION_CONCURRENCY ?? DEFAULT_CONCURRENCY
);
const sql = await readFile(migrationPath, "utf8");
const allFeeds = readCandidateFeeds(sql);
const feeds = allFeeds.slice(
  requestedOffset,
  requestedLimit > 0 ? requestedOffset + requestedLimit : undefined
);

if (feeds.length === 0) {
  throw new Error(`No candidate feed rows found in ${migrationPath}`);
}

const results = await mapConcurrent(feeds, requestedConcurrency, validateFeed);
const failed = results.filter((result) => !result.ok);
const categoryCounts = Object.fromEntries(
  [...new Set(feeds.map((feed) => feed.category))]
    .sort()
    .map((category) => [
      category,
      results.filter((result) => result.category === category && result.ok).length
    ])
);

console.log(JSON.stringify({
  migrationPath,
  offset: requestedOffset,
  checked: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  passedByCategory: categoryCounts,
  failures: failed.map(({ source, label, url, category, error }) => ({
    source,
    label,
    url,
    category,
    error
  }))
}, null, 2));

process.exitCode = failed.length === 0 ? 0 : 1;
