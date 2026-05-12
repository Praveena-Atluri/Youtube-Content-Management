import OpenAI from "openai";

import { getEnv } from "@/lib/env";
import type {
  GeneratedBundle,
  GenerationMode,
  StoryRecord,
  VideoOutput,
  WebStoryOutput
} from "@/lib/types";

export async function generateContentBundle(
  story: StoryRecord,
  mode: GenerationMode
): Promise<GeneratedBundle> {
  const env = getEnv();
  const openai = new OpenAI({
    apiKey: env.openAiApiKey
  });

  const prompt =
    mode === "video" ? buildVideoPrompt(story) : buildWebStoryPrompt(story);

  const response = await openai.responses.create({
    model: env.openAiChatModel,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: mode === "video" ? "video_content_bundle" : "web_story_content_bundle",
        strict: true,
        schema: mode === "video" ? videoSchema : webStorySchema
      }
    }
  });

  const content = JSON.parse(response.output_text) as VideoOutput | WebStoryOutput;

  if (mode === "video") {
    return { video: content as VideoOutput };
  }

  return { webStory: content as WebStoryOutput };
}

function buildVideoPrompt(story: StoryRecord) {
  return `
You are a senior Telugu YouTube content strategist.
Generate one detailed Telugu video script and a reach-focused packaging kit.

For the video script:
- write one elaborate Telugu narration script
- do not make it short
- aim for roughly 700 to 1100 Telugu words
- include a strong hook, context, developments, analysis, audience-friendly explanations, and a strong closing
- write in natural presenter language that can be read directly on camera

For the packaging:
- provide exactly 5 CTR-friendly Telugu title suggestions
- provide 1 SEO-friendly Telugu description
- provide exactly 12 high-relevance keywords or short keyphrases
- provide exactly 5 short thumbnail text suggestions
- optimize all packaging for CTR, search discovery, and audience interest without being misleading

Story title: ${story.title}
Summary: ${story.summary}
Body: ${story.content_body}
Virality score: ${story.virality_score}
Source: ${story.metadata.source}
Source URL: ${story.metadata.link ?? "N/A"}

Return valid JSON with this exact shape:
{
  "script": "One detailed Telugu video script.",
  "suggestedTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "description": "One SEO-friendly Telugu video description.",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8", "keyword 9", "keyword 10", "keyword 11", "keyword 12"],
  "thumbnailTextSuggestions": ["text 1", "text 2", "text 3", "text 4", "text 5"]
}
`;
}

function buildWebStoryPrompt(story: StoryRecord) {
  return `
You are a senior Telugu web story content strategist.
Generate a comprehensive Telugu Web Story Script and an SEO-Optimization Kit in valid JSON format based on the provided data.
For the web story script:
- write a separate Telugu web story as one flowing text story
- do not structure it as cards, slides, or bullet points
- make it crisp, visually readable, emotionally engaging, and easy to publish as a text-based web story
- the overall story must be at least 400 words
- make the narration effective and interesting in Telugu so it grabs user attention using simple words.
- write it as one continuous, polished story in paragraph form
- avoid flat, generic summaries and give enough detail.

For the packaging:
- provide exactly 5 short, punchy, highly clickable titles
- provide 1 SEO-friendly Telugu description tailored to web story discovery
- provide exactly 12 relevant keywords or short keyphrases
- provide exactly 5 English URL slug suggestions that are short, readable, keyword-rich, and SEO-friendly
- use lowercase English words separated by hyphens for the URL suggestions
- optimize for curiosity and discoverability without being misleading

Story:
Story title: ${story.title}
Summary: ${story.summary}
Body: ${story.content_body}
Source URL: ${story.metadata.link ?? "N/A"}

Return valid JSON with this exact shape:
{
  "script": "One Telugu web story written as a flowing text story.",
  "suggestedTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "description": "One SEO-friendly Telugu web story description.",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8", "keyword 9", "keyword 10", "keyword 11", "keyword 12"],
  "urlSuggestions": ["slug-1", "slug-2", "slug-3", "slug-4", "slug-5"]
}
`;
}

const videoSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    script: { type: "string" },
    suggestedTitles: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5
    },
    description: { type: "string" },
    keywords: {
      type: "array",
      items: { type: "string" },
      minItems: 12,
      maxItems: 12
    },
    thumbnailTextSuggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5
    }
  },
  required: [
    "script",
    "suggestedTitles",
    "description",
    "keywords",
    "thumbnailTextSuggestions"
  ]
} as const;

const webStorySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    script: { type: "string" },
    suggestedTitles: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5
    },
    description: { type: "string" },
    keywords: {
      type: "array",
      items: { type: "string" },
      minItems: 12,
      maxItems: 12
    },
    urlSuggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5
    }
  },
  required: ["script", "suggestedTitles", "description", "keywords", "urlSuggestions"]
} as const;
