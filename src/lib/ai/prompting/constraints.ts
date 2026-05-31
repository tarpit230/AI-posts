import type { Platform } from "@/types/post";

export const generationRules: Record<Platform, string> = {
  x: "Keep it concise, sharp, and under 280 characters where possible.",
  instagram: "Lead with a hook, keep paragraphs readable, and include discoverable hashtags.",
  linkedin: "Sound expert, practical, and credibility-first.",
  threads: "Use a conversational voice and a clear opinion.",
  facebook: "Write like a friendly update people want to comment on.",
  youtube_community: "Ask for feedback or opinions and keep it community focused."
};
