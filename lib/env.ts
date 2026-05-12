function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    openAiApiKey: requireEnv("OPENAI_API_KEY"),
    openAiChatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4-mini",
    openAiEmbedModel: process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small"
  };
}
