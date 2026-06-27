import { getEnv } from "@/lib/env";

const DEFAULT_DEVOTIONAL_KEYWORDS = [
  "devotional",
  "spirituality",
  "spiritual",
  "temple",
  "tirumala",
  "tirupati",
  "ttd",
  "darshan",
  "darshanam",
  "puja",
  "pooja",
  "bhakti",
  "pilgrimage",
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
  "దర్శనం",
  "తిరుమల",
  "తిరుపతి",
  "శ్రీవారి",
  "రాశి ఫలాలు",
  "జాతకం",
  "పంచాంగం",
  "వాస్తు",
  "మంత్రం",
  "శ్లోకం",
  "రామాయణం",
  "మహాభారతం"
] as const;

function parseKeywordList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function getDevotionalKeywords() {
  const configuredKeywords = parseKeywordList(getEnv().devotionalKeywords);
  if (configuredKeywords.length > 0) {
    return configuredKeywords;
  }

  return [...DEFAULT_DEVOTIONAL_KEYWORDS];
}

export { DEFAULT_DEVOTIONAL_KEYWORDS };
