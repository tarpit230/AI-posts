import type { Platform } from "@/types/post";
import type { AIModelInfo } from "@/types/providers";

const geminiPlatformPreferences: Record<Platform, string[]> = {
  x: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  instagram: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  linkedin: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
  threads: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  facebook: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  youtube_community: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"]
};

function matchesGeminiPreference(modelId: string, preference: string) {
  return modelId === preference || modelId.startsWith(`${preference}-`) || modelId.startsWith(`${preference}_`);
}

export function chooseGeminiModel(platform: Platform, models: AIModelInfo[], fallbackModel?: string) {
  const preferences = geminiPlatformPreferences[platform];
  for (const preference of preferences) {
    const exactMatch = models.find((model) => matchesGeminiPreference(model.id, preference));
    if (exactMatch) return exactMatch.id;
  }
  return fallbackModel ?? models[0]?.id ?? "";
}

export function isGeminiModel(modelId: string) {
  return modelId.startsWith("gemini-");
}
