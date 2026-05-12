import type { GenerationMode } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateContentBundle } from "@/lib/llm";
import { getStoryById } from "@/lib/trending-topics";

const requestSchema = z.object({
  storyId: z.string().uuid(),
  mode: z.enum(["video", "webStory"])
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const { storyId, mode } = requestSchema.parse(json) as {
    storyId: string;
    mode: GenerationMode;
  };

  const story = await getStoryById(storyId);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const content = await generateContentBundle(story, mode);
  return NextResponse.json(content);
}
