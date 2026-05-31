import type { AIModelInfo, AIProviderId, ModelPricing, ProviderInfo, ProviderOption } from "@/types/providers";

export type AIAction = "post" | "variations" | "hashtags" | "hook" | "cta" | "score";

export interface AIRequestBase {
  provider: AIProviderId;
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AITextResult {
  text: string;
  model: string;
  provider: AIProviderId;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  latencyMs?: number;
  raw?: unknown;
}

export interface AIProviderRuntime {
  id: AIProviderId;
  label: string;
  pricing: ModelPricing | "mixed";
  models: AIModelInfo[];
  isConfigured: () => boolean;
  listModels: () => AIModelInfo[];
  generateText: (request: AIRequestBase) => Promise<AITextResult>;
}

export type { AIModelInfo, AIProviderId, ModelPricing, ProviderInfo, ProviderOption };
