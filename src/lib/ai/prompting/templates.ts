import type { Platform } from "@/types/post";
import { generationRules } from "./constraints";

function joinParts(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" | ");
}

export function buildPostPrompt(input: {
  platform: Platform;
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
  postFormat?: "text" | "image";
}) {
  const formatLine = input.postFormat === "image" && input.platform === "instagram"
    ? [
        "Format: Instagram image post.",
        "Write a short caption for the image, not a full text post.",
        "Keep the caption punchy, social, and suitable to sit next to a visual."
      ].join(" ")
    : "Format: Text post.";
  return [
    `Platform: ${input.platform}`,
    `Goal: ${input.goal ?? "engagement"}`,
    `Topic: ${input.topic}`,
    input.niche ? `Niche: ${input.niche}` : undefined,
    input.tone ? `Tone: ${input.tone}` : undefined,
    formatLine,
    `Rules: ${generationRules[input.platform]}`,
    "Return a strong post draft with a hook, body, and CTA when useful."
  ].join("\n");
}

export function buildInstagramImagePrompt(input: {
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
}) {
  return [
    "Create a detailed image concept for an Instagram post.",
    `Topic: ${input.topic}`,
    input.niche ? `Niche: ${input.niche}` : undefined,
    input.tone ? `Tone: ${input.tone}` : undefined,
    input.goal ? `Goal: ${input.goal}` : undefined,
    "Describe the visual composition, subject, style, colors, mood, and any on-image text if useful.",
    "Keep it suitable for a social media image generation tool."
  ].filter(Boolean).join("\n");
}

export function buildVariationPrompt(content: string, platform: Platform, count: number) {
  return [
    `Create ${count} fresh variations for ${platform}.`,
    generationRules[platform],
    "Keep the core idea but vary the opening, wording, and CTA.",
    `Source content: ${content}`
  ].join("\n");
}

export function buildHashtagPrompt(content: string, platform: Platform, count: number) {
  return [
    `Generate ${count} relevant hashtags for ${platform}.`,
    "Avoid generic or spammy tags.",
    `Post content: ${content}`
  ].join("\n");
}

export function buildHookPrompt(content: string, platform: Platform) {
  return joinParts([
    `Write one strong hook for ${platform}.`,
    generationRules[platform],
    `Content: ${content}`
  ]);
}

export function buildCtaPrompt(content: string, platform: Platform, goal?: string) {
  return joinParts([
    `Write one CTA for ${platform}.`,
    goal ? `Goal: ${goal}` : undefined,
    `Content: ${content}`
  ]);
}
