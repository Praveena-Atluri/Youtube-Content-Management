import type { StoryRecord } from "@/lib/types";

const GOOGLE_NEWS_HOST = "news.google.com";
const INVALID_ARTIFACT_HOSTS = [
  "googleusercontent.com",
  "gstatic.com",
  "google.com",
  "www.google.com",
  "google-analytics.com",
  "www.google-analytics.com",
  "googletagmanager.com",
  "www.googletagmanager.com",
  "doubleclick.net",
  "www.doubleclick.net"
];

function isGoogleNewsUrl(url: string) {
  try {
    return new URL(url).hostname === GOOGLE_NEWS_HOST;
  } catch {
    return false;
  }
}

function isInvalidGoogleArtifactUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === GOOGLE_NEWS_HOST) {
      return false;
    }
    return INVALID_ARTIFACT_HOSTS.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

function extractArticleUrlFromGoogleHtml(html: string) {
  const patterns = [
    /data-n-au="(https?:\/\/[^"]+)"/i,
    /data-url="(https?:\/\/[^"]+)"/i,
    /"canonicalUrl":"(https?:\/\/[^"]+)"/i
  ];

  for (const pattern of patterns) {
    const matches = pattern.global ? html.match(pattern) : html.match(pattern);
    if (!matches) {
      continue;
    }

    const candidates = Array.isArray(matches)
      ? matches
      : [matches[1] ?? matches[0]];

    for (const rawCandidate of candidates) {
      const candidate = rawCandidate
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"');

      try {
        const parsed = new URL(candidate);
        if (parsed.hostname !== GOOGLE_NEWS_HOST && !isInvalidGoogleArtifactUrl(candidate)) {
          return candidate;
        }
      } catch {
        continue;
      }
    }
  }

  return "";
}

async function decodeGoogleNewsBatchExecute(id: string) {
  const requestPayload =
    '[[["Fbv4je","[\\"garturlreq\\",[[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +
    id +
    '\\"]",null,"generic"]]]';

  const response = await fetch(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        Referrer: "https://news.google.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      body: `f.req=${encodeURIComponent(requestPayload)}`
    }
  );

  const responseText = await response.text();
  const header = '[\\"garturlres\\",\\"';
  const footer = '\\",';

  if (!responseText.includes(header)) {
    return "";
  }

  const start = responseText.substring(responseText.indexOf(header) + header.length);
  if (!start.includes(footer)) {
    return "";
  }

  return start.substring(0, start.indexOf(footer));
}

async function decodeGoogleNewsUrl(url: string) {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split("/");
  const articleId = pathParts.at(-1);

  if (pathParts.at(-2) !== "articles" || !articleId) {
    return "";
  }

  let decoded = Buffer.from(articleId, "base64").toString("binary");
  const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("binary");
  if (decoded.startsWith(prefix)) {
    decoded = decoded.slice(prefix.length);
  }

  const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("binary");
  if (decoded.endsWith(suffix)) {
    decoded = decoded.slice(0, -suffix.length);
  }

  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  const len = bytes.at(0);
  if (len === undefined) {
    return "";
  }

  decoded = len >= 0x80 ? decoded.substring(2, len + 2) : decoded.substring(1, len + 1);

  if (decoded.startsWith("AU_yqL")) {
    return decodeGoogleNewsBatchExecute(articleId);
  }

  return decoded.startsWith("http://") || decoded.startsWith("https://") ? decoded : "";
}

export async function resolveArticleUrl(source: string, url: string) {
  if (!url || source !== "Google News Telugu") {
    return url;
  }

  if (isInvalidGoogleArtifactUrl(url)) {
    return url;
  }

  if (!isGoogleNewsUrl(url)) {
    return url;
  }

  try {
    const decodedUrl = await decodeGoogleNewsUrl(url);
    if (decodedUrl && !isInvalidGoogleArtifactUrl(decodedUrl)) {
      return decodedUrl;
    }

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    const finalUrl = response.url;
    if (
      finalUrl &&
      !isGoogleNewsUrl(finalUrl) &&
      !isInvalidGoogleArtifactUrl(finalUrl)
    ) {
      return finalUrl;
    }

    const html = await response.text();
    const extractedUrl = extractArticleUrlFromGoogleHtml(html);
    return extractedUrl || url;
  } catch {
    return url;
  }
}

export async function normalizeStorySourceUrl(story: StoryRecord) {
  const currentUrl = story.metadata.link;
  if (!currentUrl) {
    return story;
  }

  if (
    story.metadata.source === "Google News Telugu" &&
    isInvalidGoogleArtifactUrl(currentUrl)
  ) {
    return {
      ...story,
      metadata: {
        ...story.metadata,
        link: ""
      }
    };
  }

  const resolvedUrl = await resolveArticleUrl(story.metadata.source, currentUrl);

  // If Google News decode fails, keep the raw Google News article URL visible
  // instead of blanking the source link in the UI.
  if (
    story.metadata.source === "Google News Telugu" &&
    (!resolvedUrl || isInvalidGoogleArtifactUrl(resolvedUrl))
  ) {
    return story;
  }

  if (resolvedUrl === currentUrl) {
    return story;
  }

  return {
    ...story,
    metadata: {
      ...story.metadata,
      link: resolvedUrl
    }
  };
}
