import { z } from "zod";

const platformSchema = z.enum([
  "x",
  "instagram",
  "linkedin",
  "threads",
  "facebook",
  "youtube_community"
]);

const providerSchema = z.enum([
  "openai",
  "gemini",
  "anthropic",
  "groq",
  "openrouter",
  "huggingface",
  "ollama"
]);

export const postQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  platform: platformSchema.optional(),
  status: z.enum(["draft", "posted", "archived"]).optional(),
  q: z.string().trim().optional()
});

export const postDraftSchema = z.object({
  platform: platformSchema,
  topic: z.string().trim().min(2).max(280),
  niche: z.string().trim().max(120).optional(),
  tone: z.string().trim().max(80).optional(),
  goal: z.string().trim().max(120).optional(),
  postFormat: z.enum(["text", "image"]).optional().default("text"),
  provider: providerSchema,
  model: z.string().trim().min(1),
  content: z.string().trim().min(1),
  imagePrompt: z.string().trim().optional(),
  imageAsset: z.string().optional(),
  imageAlt: z.string().trim().optional(),
  externalPlatform: z.literal("x").optional(),
  externalPostId: z.string().trim().optional(),
  externalUrl: z.string().trim().url().optional(),
  hashtags: z.array(z.string().trim()).optional().default([]),
  hook: z.string().trim().optional(),
  cta: z.string().trim().optional()
});

export const postPatchSchema = postDraftSchema.partial().extend({
  status: z.enum(["draft", "posted", "archived"]).optional(),
  postedAt: z.string().datetime().optional(),
  scores: z.object({
    engagement: z.number().min(1).max(100),
    monetization: z.number().min(1).max(100),
    explanation: z.string().optional(),
    computedAt: z.string()
  }).optional()
});

export const generationSchema = z.object({
  platform: platformSchema,
  topic: z.string().trim().min(2).max(280),
  niche: z.string().trim().max(120).optional(),
  tone: z.string().trim().max(80).optional(),
  goal: z.string().trim().max(120).optional(),
  postFormat: z.enum(["text", "image"]).optional().default("text"),
  provider: providerSchema,
  model: z.string().trim().min(1)
});

export const imageGenerationSchema = z.object({
  platform: platformSchema,
  topic: z.string().trim().min(2).max(280),
  content: z.string().trim().min(1),
  imagePrompt: z.string().trim().optional(),
  niche: z.string().trim().max(120).optional(),
  tone: z.string().trim().max(80).optional(),
  goal: z.string().trim().max(120).optional()
});

export const scoreSchema = z.object({
  platform: platformSchema,
  content: z.string().trim().min(1),
  niche: z.string().trim().max(120).optional(),
  goal: z.string().trim().max(120).optional()
});

export const providerParamSchema = z.object({
  provider: providerSchema
});

export type PostDraftInput = z.infer<typeof postDraftSchema>;
export type PostPatchInput = z.infer<typeof postPatchSchema>;
export type GenerationInput = z.infer<typeof generationSchema>;
export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;
export type ScoreInput = z.infer<typeof scoreSchema>;
