import { extractHashtags, extractLines } from "./runtime";
import {
  buildCtaPrompt,
  buildHashtagPrompt,
  buildHookPrompt,
  buildInstagramImagePrompt,
  buildPostPrompt,
  buildVariationPrompt
} from "./prompting/templates";
import { getProvider } from "./registry";
import { scoreContent } from "../scoring/heuristics";
import { createInstagramImageAsset } from "../images/instagram";
import type { GenerationInput } from "../validation/schemas";
import type { DraftGenerationResult, Platform } from "@/types/post";

function wrapPrompt(platform: Platform, prompt: string) {
  return `${prompt}\n\nPlatform guidance: ${platform}`;
}

async function generateWithProvider(input: GenerationInput, action: "post" | "image" | "variations" | "hashtags" | "hook" | "cta") {
  const provider = getProvider(input.provider);
  const prompt =
    action === "post"
      ? buildPostPrompt(input)
      : action === "image"
        ? buildInstagramImagePrompt(input)
      : action === "variations"
        ? buildVariationPrompt(input.topic, input.platform, 3)
        : action === "hashtags"
          ? buildHashtagPrompt(input.topic, input.platform, 8)
          : action === "hook"
            ? buildHookPrompt(input.topic, input.platform)
            : buildCtaPrompt(input.topic, input.platform, input.goal);
  const safePrompt = wrapPrompt(input.platform, prompt);
  if (!provider) {
    throw new Error(`Provider ${input.provider} is not available.`);
  }
  console.log("[AI] generateWithProvider", {
    action,
    provider: input.provider,
    model: input.model,
    platform: input.platform,
    prompt: safePrompt
  });
  return provider.generateText({
    provider: input.provider,
    model: input.model,
    prompt: safePrompt,
    system: `You generate social content for ${input.platform}.`
  });
}

export async function generatePostDraft(input: GenerationInput): Promise<DraftGenerationResult> {
  const result = await generateWithProvider(input, "post");
  console.log("[AI] provider result", result);
  const text = result.text.trim();
  let imagePrompt: string | undefined;
  if (input.platform === "instagram" && input.postFormat === "image") {
    try {
      imagePrompt = (await generateWithProvider(input, "image")).text.trim();
    } catch (error) {
      console.warn("[AI] image prompt generation failed, using local fallback", error);
      imagePrompt = buildInstagramImagePrompt(input);
    }
  }
  const generatedImage =
    input.platform === "instagram" && input.postFormat === "image"
      ? createInstagramImageAsset({
          topic: input.topic,
          content: text,
          imagePrompt,
          niche: input.niche,
          tone: input.tone,
          goal: input.goal
        })
      : undefined;
  const hashtags = extractHashtags(text);
  const hook = text.split("\n")[0]?.trim() ?? "";
  const cta = /(?:follow|comment|share|save|reply|subscribe)/i.test(text)
    ? text.match(/(?:follow|comment|share|save|reply|subscribe)[^.!\n]*/i)?.[0] ?? ""
    : "";
  return {
    content: text,
    imagePrompt,
    imageAsset: generatedImage?.imageAsset,
    imageAlt: generatedImage?.imageAlt,
    hashtags,
    hook,
    cta,
    score: scoreContent({ platform: input.platform, content: text, niche: input.niche, goal: input.goal }),
    provider: input.provider,
    model: input.model,
    meta: { ...result }
  };
}

export async function generateVariations(input: GenerationInput, content: string, count = 3) {
  const result = await generateWithProvider(input, "variations");
  const lines = extractLines(result.text, count);
  if (lines.length) return lines;
  return Array.from({ length: count }, (_, index) => `${index + 1}. ${content} (variation ${index + 1})`);
}

export async function generateHashtags(input: GenerationInput, content: string, count = 8) {
  const result = await generateWithProvider(input, "hashtags");
  const tags = extractHashtags(result.text + "\n" + content, count);
  return tags.length ? tags : Array.from({ length: count }, (_, index) => `#tag${index + 1}`);
}

export async function generateHook(input: GenerationInput, content: string) {
  const result = await generateWithProvider(input, "hook");
  return result.text.trim().split("\n")[0] ?? content.slice(0, 80);
}

export async function generateCta(input: GenerationInput) {
  const result = await generateWithProvider(input, "cta");
  return result.text.trim().split("\n")[0] ?? "What do you think?";
}
