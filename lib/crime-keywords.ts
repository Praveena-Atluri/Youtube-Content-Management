import { getEnv } from "@/lib/env";

const DEFAULT_CRIME_KEYWORDS = [
  "crime",
  "criminal",
  "murder",
  "homicide",
  "assassination",
  "attempted murder",
  "rape",
  "sexual assault",
  "kidnapping",
  "abduction",
  "robbery",
  "burglary",
  "theft",
  "arson",
  "smuggling",
  "trafficking",
  "narcotics",
  "drug seizure",
  "gangster",
  "mafia",
  "fraud",
  "scam",
  "cybercrime",
  "cyber crime",
  "phishing",
  "extortion",
  "blackmail",
  "arrested",
  "accused",
  "suspect",
  "fir",
  "chargesheet",
  "charge sheet",
  "convicted",
  "sentenced",
  "custody",
  "remand",
  "prison",
  "bail",
  "terrorism",
  "terrorist",
  "encounter",
  "నేరం",
  "నేరాలు",
  "క్రైమ్",
  "హత్య",
  "హత్యాయత్నం",
  "అత్యాచారం",
  "లైంగిక వేధింపులు",
  "కిడ్నాప్",
  "అపహరణ",
  "దోపిడీ",
  "చోరీ",
  "దొంగతనం",
  "స్మగ్లింగ్",
  "అక్రమ రవాణా",
  "మాదకద్రవ్యాలు",
  "డ్రగ్స్",
  "గంజాయి",
  "గ్యాంగ్",
  "మాఫియా",
  "మోసం",
  "కుంభకోణం",
  "సైబర్ నేరం",
  "ఫిషింగ్",
  "బెదిరింపు",
  "బ్లాక్‌మెయిల్",
  "బ్లాక్‌మెయిల్",
  "అరెస్ట్",
  "నిందితుడు",
  "అనుమానితుడు",
  "ఎఫ్ఐఆర్",
  "ఎఫ్‌ఐఆర్",
  "చార్జిషీట్",
  "అదుపులోకి",
  "రిమాండ్",
  "జైలు",
  "బెయిల్",
  "శిక్ష",
  "ఉగ్రవాదం",
  "ఉగ్రవాది",
  "ఎన్‌కౌంటర్"
] as const;

function parseKeywordList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function getCrimeKeywords() {
  const configuredKeywords = parseKeywordList(getEnv().crimeKeywords);
  return configuredKeywords.length > 0
    ? configuredKeywords
    : [...DEFAULT_CRIME_KEYWORDS];
}

export { DEFAULT_CRIME_KEYWORDS };
