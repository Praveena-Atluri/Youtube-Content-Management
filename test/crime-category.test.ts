import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULT_CRIME_KEYWORDS, getCrimeKeywords } from "../lib/crime-keywords";
import { CATEGORY_ORDER } from "../lib/feed-sources";
import { normalizeCategory } from "../lib/trending-topics";
import { containsWholeKeyword, inferTaxonomy } from "../lib/taxonomy";

const EMPTY_KEYWORDS = {
  crime: DEFAULT_CRIME_KEYWORDS,
  devotional: [],
  movies: [],
  sports: []
};

test("crime is a first-class category immediately after news", () => {
  assert.equal(normalizeCategory("crime"), "crime");
  assert.deepEqual(CATEGORY_ORDER.slice(0, 2), ["news", "crime"]);
});

test("English, Telugu, phrases, casing, and article URLs classify news as crime", () => {
  for (const [text, url] of [
    ["Police make ARRESTED suspect announcement", ""],
    ["Attempted murder investigation", ""],
    ["నిందితుడు అరెస్ట్", ""],
    ["లైంగిక వేధింపులు వెలుగులోకి", ""],
    ["Ordinary headline", "https://example.com/latest/cybercrime-alert"]
  ]) {
    assert.equal(inferTaxonomy(text, url, "news", EMPTY_KEYWORDS).category, "crime");
  }
});

test("broad legal words and unrelated substrings remain news", () => {
  for (const text of [
    "The court hears a civil case",
    "Police begin an investigation",
    "The team plans a new attack",
    "Courtney presents a showcase",
    "A suspiciously good performance"
  ]) {
    assert.equal(inferTaxonomy(text, "", "news", EMPTY_KEYWORDS).category, "news");
  }

  assert.equal(containsWholeKeyword("Courtney", "court"), false);
});

test("crime wins keyword precedence while explicit feed categories remain authoritative", () => {
  const keywords = {
    crime: ["arrested"],
    sports: ["match"],
    movies: ["actor"],
    devotional: ["temple"]
  };

  assert.equal(
    inferTaxonomy("Actor arrested after match", "", "news", keywords).category,
    "crime"
  );

  for (const category of [
    "crime", "movies", "sports", "business", "health", "devotional", "tech"
  ] as const) {
    assert.equal(
      inferTaxonomy("Actor arrested after match", "", category, keywords).category,
      category
    );
  }
});

test("CRIME_KEYWORDS fully replaces the local defaults", () => {
  const original = process.env.CRIME_KEYWORDS;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
  process.env.CRIME_KEYWORDS = "custom crime,\nప్రత్యేక నేరం";

  try {
    assert.deepEqual(getCrimeKeywords(), ["custom crime", "ప్రత్యేక నేరం"]);
  } finally {
    if (original === undefined) delete process.env.CRIME_KEYWORDS;
    else process.env.CRIME_KEYWORDS = original;
  }
});

test("database migration assigns exactly the selected crime feeds and backfills stories", async () => {
  const [schema, international, migration] = await Promise.all([
    readFile("supabase/migrations/schema.sql", "utf8"),
    readFile("supabase/migrations/schema_requested_international_rss_feeds.sql", "utf8"),
    readFile("supabase/migrations/schema_crime_2_category.sql", "utf8")
  ]);

  const labels = [
    ...schema.matchAll(/'([^']+)',\s*'https?:\/\/[^']+',\s*'crime'/g),
    ...international.matchAll(/'([^']+)',\s*'https?:\/\/[^']+',\s*'crime'/g)
  ].map((match) => match[1]);

  assert.deepEqual(labels.sort(), [
    "ABP Live - Crime",
    "Crimewatch",
    "FBI - All Wanted",
    "FBI - Congressional Testimony",
    "FBI - Executive Speeches",
    "FBI - National Press Releases",
    "FBI - News Blog",
    "FBI - Top Stories",
    "InSight Crime",
    "India Crime"
  ].sort());
  assert.match(migration, /update public\.trending_topics/);
  assert.match(migration, /metadata->>'feedLabel' = 'ABP Live - Crime'/);
});

test("the Edge Function supports default and overridden crime keywords", async () => {
  const edge = await readFile("supabase/functions/sync-feeds/index.ts", "utf8");
  assert.match(edge, /DEFAULT_CRIME_KEYWORDS/);
  assert.match(edge, /Deno\.env\.get\("CRIME_KEYWORDS"\)/);
  assert.match(edge, /includesAny\(crimeKeywords\)/);
});
