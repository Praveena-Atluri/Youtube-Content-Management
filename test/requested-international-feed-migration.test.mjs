import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const MIGRATIONS_DIR = "supabase/migrations";
const MIGRATION_NAME = "schema_requested_international_rss_feeds.sql";
const MIGRATION = path.join(MIGRATIONS_DIR, MIGRATION_NAME);
const ROW_PATTERN = /^\s*\('((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'(https?:\/\/(?:''|[^'])*)',\s*'(news|crime|movies|tech|sports|business|health|devotional)',\s*(true|false),\s*(\d+)\),?$/gm;

function rowsFromSql(sql) {
  return [...sql.matchAll(ROW_PATTERN)].map((match) => ({
    source: match[1].replaceAll("''", "'"),
    label: match[2].replaceAll("''", "'"),
    url: match[3].replaceAll("''", "'"),
    category: match[4],
    active: match[5] === "true",
    displayOrder: Number(match[6])
  }));
}

function normalizeUrl(url) {
  return url.toLowerCase().replace(/\/$/, "");
}

test("requested international RSS migration has the approved rows and mappings", async () => {
  const sql = await readFile(MIGRATION, "utf8");
  const rows = rowsFromSql(sql);

  assert.equal(rows.length, 109);
  assert.ok(rows.every((row) => row.active));
  assert.deepEqual(
    rows.map((row) => row.displayOrder),
    Array.from({ length: 109 }, (_, index) => 6000 + index)
  );

  const categoryCounts = Object.fromEntries(
    [...new Set(rows.map((row) => row.category))].map((category) => [
      category,
      rows.filter((row) => row.category === category).length
    ])
  );

  assert.deepEqual(categoryCounts, {
    news: 55,
    crime: 9,
    business: 7,
    health: 9,
    tech: 11,
    movies: 12,
    sports: 6
  });

  const normalizedUrls = rows.map((row) => normalizeUrl(row.url));
  assert.equal(new Set(normalizedUrls).size, rows.length);
  assert.ok(sql.includes("lower(rtrim(existing.url, '/'))"));
  assert.ok(sql.includes("on conflict (url) do nothing"));
});

test("requested feeds do not repeat URLs from earlier migrations", async () => {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".sql") && file !== MIGRATION_NAME)
    .sort();
  const existingSql = (
    await Promise.all(files.map((file) => readFile(path.join(MIGRATIONS_DIR, file), "utf8")))
  ).join("\n");
  const existingUrls = new Set(
    [...existingSql.matchAll(/https?:\/\/[^'\s)]+/g)].map((match) =>
      normalizeUrl(match[0])
    )
  );
  const rows = rowsFromSql(await readFile(MIGRATION, "utf8"));

  assert.deepEqual(
    rows.filter((row) => existingUrls.has(normalizeUrl(row.url))),
    []
  );

  const addedUrls = new Set(rows.map((row) => normalizeUrl(row.url)));
  assert.ok(!addedUrls.has(normalizeUrl("https://indianexpress.com/feed/")));
  assert.ok(
    !addedUrls.has(
      normalizeUrl("https://indianexpress.com/section/health-wellness/feed/")
    )
  );
  assert.ok(
    !addedUrls.has(normalizeUrl("https://feeds.feedburner.com/ndtvsports-latest"))
  );
});

test("known invalid and unavailable endpoints remain excluded", async () => {
  const rows = rowsFromSql(await readFile(MIGRATION, "utf8"));
  const urls = new Set(rows.map((row) => normalizeUrl(row.url)));

  for (const excludedUrl of [
    "https://apnews.com/index.rss",
    "https://www.nationalcrimeagency.gov.uk/rss.xml",
    "https://www.unodc.org/unodc/feed/stories.xml",
    "https://www.unodc.org/unodc/en/feed/press-releases.xml",
    "https://feeds.feedburner.com/carandbike-latest"
  ]) {
    assert.ok(!urls.has(normalizeUrl(excludedUrl)));
  }

  assert.ok([...urls].every((url) => !url.includes("caravanmagazine.in")));
  assert.ok(rows.some((row) => row.url.startsWith("http://rss.cnn.com/")));
});
