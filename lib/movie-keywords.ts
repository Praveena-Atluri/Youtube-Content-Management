import { getEnv } from "@/lib/env";

const DEFAULT_MOVIE_KEYWORDS = [
  "tollywood",
  "mahesh babu",
  "prabhas",
  "ntr",
  "allu arjun",
  "pawan kalyan",
  "chiranjeevi",
  "cinema",
  "box office",
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

function parseKeywordList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function getMovieKeywords() {
  const configuredKeywords = parseKeywordList(getEnv().movieKeywords);
  if (configuredKeywords.length > 0) {
    return configuredKeywords;
  }

  return [...DEFAULT_MOVIE_KEYWORDS];
}

export { DEFAULT_MOVIE_KEYWORDS };
