import OpenAI from "openai";

import { getEnv } from "@/lib/env";

export async function createEmbedding(input: string) {
  const env = getEnv();
  const openai = new OpenAI({
    apiKey: env.openAiApiKey
  });

  const response = await openai.embeddings.create({
    model: env.openAiEmbedModel,
    input
  });

  return response.data[0]?.embedding ?? [];
}
