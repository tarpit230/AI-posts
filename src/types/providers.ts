export type AIProviderId =
  | "openai"
  | "gemini"
  | "anthropic"
  | "groq"
  | "openrouter"
  | "huggingface"
  | "ollama";

export type ModelPricing = "free" | "paid" | "local";

export interface AIModelInfo {
  id: string;
  label: string;
  pricing: ModelPricing;
  contextWindow?: number;
}

export interface ProviderInfo {
  id: AIProviderId;
  label: string;
  configured: boolean;
  pricing: ModelPricing | "mixed";
  baseUrl?: string;
  models: AIModelInfo[];
}

export interface ProviderOption {
  id: AIProviderId;
  label: string;
  configured: boolean;
}
