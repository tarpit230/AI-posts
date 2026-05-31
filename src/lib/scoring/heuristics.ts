import type { Platform } from "@/types/post";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function scoreContent(input: {
  platform: Platform;
  content: string;
  niche?: string;
  goal?: string;
}) {
  const words = input.content.trim().split(/\s+/).filter(Boolean).length;
  const lengthScore = clamp(100 - Math.abs(words - 90), 35, 100);
  const hookBoost = /(\?|!|now|why|how|what|discover|insight|secret)/i.test(input.content)
    ? 10
    : 0;
  const emojiBoost = /[\u{1F300}-\u{1FAFF}]/u.test(input.content) ? 5 : 0;
  const ctaBoost = /(follow|comment|save|share|reply|subscribe|click)/i.test(input.content)
    ? 8
    : 0;
  const platformBias: Record<Platform, number> = {
    x: 6,
    instagram: 5,
    linkedin: 9,
    threads: 7,
    facebook: 6,
    youtube_community: 7
  };
  const engagement = clamp(
    Math.round((lengthScore + hookBoost + emojiBoost + ctaBoost + platformBias[input.platform]) / 2),
    1,
    100
  );
  const monetization = clamp(
    Math.round(engagement * 0.68 + (input.goal?.toLowerCase().includes("sell") ? 12 : 0)),
    1,
    100
  );
  return {
    engagement,
    monetization,
    explanation: "Heuristic score based on length, hook strength, CTA usage, and platform fit.",
    computedAt: new Date().toISOString()
  };
}
