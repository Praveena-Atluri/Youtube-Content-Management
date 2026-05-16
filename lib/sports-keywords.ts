import { getEnv } from "@/lib/env";

const DEFAULT_SPORTS_KEYWORDS = [
  // cricket
  "cricket",
  "ipl",
  "icc",
  "bcci",
  "test match",
  "odi",
  "t20",
  "world cup",
  "ranji",
  "rohit sharma",
  "virat kohli",
  "sanju samson",
  "bumrah",
  "dhoni",
  // ipl teams
  "sunrisers",
  "rcb",
  "csk",
  "mi",
  "kkr",
  "dc",
  "srh",
  "gt",
  "lsg",
  "pbks",
  "rr",
  // other sports
  "football",
  "fifa",
  "tennis",
  "badminton",
  "kabaddi",
  "pro kabaddi",
  "hockey",
  "boxing",
  "wrestling",
  "wwe",
  "athletics",
  "marathon",
  "chess",
  "carrom",
  "kho kho",
  "shooting",
  "archery",
  "weightlifting",
  "olympics",
  "athlete",
  "stadium",
  "match",
  "tournament",
  "championship",
  "league",
  // telugu
  "క్రికెట్",
  "ఐపీఎల్",
  "ఫుట్‌బాల్",
  "స్పోర్ట్స్",
  "టోర్నమెంట్",
  "స్కోర్",
  "విజేత",
  "ఆటగాడు",
  "మ్యాచ్",
  "క్రికెటర్",
  "బ్యాట్స్‌మన్",
  "బౌలర్"
] as const;

function parseKeywordList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function getSportsKeywords() {
  const configuredKeywords = parseKeywordList(getEnv().sportsKeywords);
  if (configuredKeywords.length > 0) {
    return configuredKeywords;
  }

  return [...DEFAULT_SPORTS_KEYWORDS];
}

export { DEFAULT_SPORTS_KEYWORDS };
