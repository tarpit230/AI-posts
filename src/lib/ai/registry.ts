import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import { fetchGroqModels } from "./providers/groq";
import { groqProvider } from "./providers/groq";
import { huggingfaceProvider } from "./providers/huggingface";
import { ollamaProvider } from "./providers/ollama";
import { openaiProvider } from "./providers/openai";
import { openrouterProvider } from "./providers/openrouter";
import type { AIProviderRuntime } from "./types";
import { fetchGeminiModels } from "./providers/gemini";

export const providers: AIProviderRuntime[] = [
  geminiProvider,
  openaiProvider,
  anthropicProvider,
  groqProvider,
  openrouterProvider,
  huggingfaceProvider,
  ollamaProvider
];

export function getProvider(providerId: AIProviderRuntime["id"]) {
  return providers.find((provider) => provider.id === providerId);
}

export function getConfiguredProviders() {
  return providers.filter((provider) => provider.isConfigured());
}

export async function getProviderCatalog() {
  return Promise.all(
    providers.map(async (provider) => ({
      id: provider.id,
      label: provider.label,
      configured: provider.isConfigured(),
      pricing: provider.pricing,
      models:
        provider.id === "gemini"
          ? await fetchGeminiModels()
          : provider.id === "groq"
            ? await fetchGroqModels()
            : provider.listModels()
    }))
  );
}

export async function getConfiguredProviderCatalog() {
  const catalog = await getProviderCatalog();
  return catalog.filter((provider) => provider.configured && provider.models.length > 0);
}

export async function getConfiguredModels(providerId: AIProviderRuntime["id"]) {
  if (providerId === "gemini") {
    return fetchGeminiModels();
  }
  if (providerId === "groq") {
    return fetchGroqModels();
  }
  return getProvider(providerId)?.listModels() ?? [];
}
