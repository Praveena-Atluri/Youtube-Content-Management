import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const MIGRATION = "supabase/migrations/schema_rss_feed_expansion.sql";
const ROW_PATTERN = /^\s*\('((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'(https?:\/\/(?:''|[^'])*)',\s*'(news|movies|tech|sports|business|health|devotional)',\s*(true|false),\s*(\d+)\),?$/gm;

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

test("RSS expansion contains only validated, normalized, unique feeds", async () => {
  const sql = await readFile(MIGRATION, "utf8");
  const rows = rowsFromSql(sql);

  assert.equal(rows.length, 173);
  assert.ok(rows.every((row) => row.active));

  const normalizedUrls = rows.map((row) => row.url.toLowerCase().replace(/\/$/, ""));
  assert.equal(new Set(normalizedUrls).size, rows.length);

  assert.ok(rows.every((row) => !row.url.includes("%3D")));
  assert.ok(rows.every((row) => !row.url.includes("/feed/feed/")));
  assert.ok(rows.every((row) => !row.url.includes("feedspot.com")));
  assert.ok(rows.every((row) => /(?:feed|rss|service=rss|newsfeed)/i.test(row.url)));

  assert.ok(sql.includes("lower(rtrim(existing.url, '/'))"));
  assert.ok(sql.includes("on conflict (url) do nothing"));
});

test("RSS expansion preserves the requested priority and category mapping", async () => {
  const rows = rowsFromSql(await readFile(MIGRATION, "utf8"));

  const categoryCounts = Object.fromEntries(
    [...new Set(rows.map((row) => row.category))].map((category) => [
      category,
      rows.filter((row) => row.category === category).length
    ])
  );

  assert.deepEqual(categoryCounts, {
    news: 134,
    business: 11,
    sports: 9,
    movies: 7,
    tech: 3,
    health: 9
  });

  assert.ok(rows.some((row) => row.displayOrder >= 1000 && row.displayOrder < 2000));
  assert.ok(rows.some((row) => row.displayOrder >= 2000 && row.displayOrder < 3000));
  assert.ok(rows.some((row) => row.displayOrder >= 4000 && row.displayOrder < 5000));
  assert.ok(rows.some((row) => row.displayOrder >= 5000 && row.displayOrder < 6000));

  assert.ok(rows.every((row) => row.source !== "Telugu DriveSpark"));
  assert.ok(rows.some((row) => row.url === "https://www.telugumirchi.com/telugu/feed"));
  assert.ok(
    rows
      .filter((row) => row.url.includes("thehindu.com/life-and-style/"))
      .every((row) => row.category === "health")
  );
});
