export type TrendingCategory = "news" | "movies";

export type StoryRecord = {
  id: string;
  category: TrendingCategory;
  title: string;
  summary: string;
  content_body: string;
  virality_score: number;
  metadata: {
    source: string;
    feedLabel: string;
    link?: string;
    publishedAt?: string;
  };
  inserted_at: string;
};

export type VideoOutput = {
  script: string;
  suggestedTitles: string[];
  description: string;
  keywords: string[];
  thumbnailTextSuggestions: string[];
};

export type WebStoryOutput = {
  script: string;
  suggestedTitles: string[];
  description: string;
  keywords: string[];
  urlSuggestions: string[];
};

export type GeneratedBundle = {
  video?: VideoOutput;
  webStory?: WebStoryOutput;
};

export type GenerationMode = "video" | "webStory";

export type FeedDefinition = {
  categoryHint: TrendingCategory;
  label: string;
  source: string;
  url: string;
};
