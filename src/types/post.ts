import type { AIProviderId, AIModelInfo } from "./providers";

export type Platform =
  | "x"
  | "instagram"
  | "linkedin"
  | "threads"
  | "facebook"
  | "youtube_community";

export type PostStatus = "draft" | "posted" | "archived";
export type PostFormat = "text" | "image";

export interface PostScore {
  engagement: number;
  monetization: number;
  explanation?: string;
  computedAt: string;
}

export interface VariationItem {
  content: string;
  provider: AIProviderId;
  model: string;
  createdAt: string;
}

export interface PostDraft {
  _id: string;
  platform: Platform;
  status: PostStatus;
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
  postFormat?: PostFormat;
  provider: AIProviderId;
  model: string;
  content: string;
  imagePrompt?: string;
  imageAsset?: string;
  imageAlt?: string;
  externalPlatform?: "x";
  externalPostId?: string;
  externalUrl?: string;
  hashtags: string[];
  hook?: string;
  cta?: string;
  variations: VariationItem[];
  scores?: PostScore;
  meta: {
    promptVersion: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostFormValues {
  platform: Platform;
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
  postFormat?: PostFormat;
  provider: AIProviderId;
  model: string;
}

export interface DraftGenerationResult {
  content: string;
  imagePrompt?: string;
  imageAsset?: string;
  imageAlt?: string;
  externalPlatform?: "x";
  externalPostId?: string;
  externalUrl?: string;
  hashtags: string[];
  hook: string;
  cta: string;
  score: PostScore;
  provider: AIProviderId;
  model: string;
  meta: Record<string, unknown>;
}
