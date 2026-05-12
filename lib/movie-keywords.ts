import { getEnv } from "@/lib/env";

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
