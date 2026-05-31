import type { AIProviderRuntime } from "../types";
import type { AITextResult } from "../types";
import { fallbackText, nowMs, withLatency } from "../runtime";
import type { AIModelInfo } from "@/types/providers";

const models = [
  { id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile", pricing: "paid" as const, contextWindow: 128000 },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", pricing: "paid" as const, contextWindow: 128000 },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", pricing: "paid" as const, contextWindow: 32768 }
];

type GroqModelItem = {
  id?: string;
  active?: boolean;
  context_window?: number;
};

let groqModelsCache: { expiresAt: number; models: AIModelInfo[] } | null = null;

function getGroqBaseUrl() {
  const configuredBaseUrl = process.env.GROQ_BASE_URL?.trim();
  if (!configuredBaseUrl || configuredBaseUrl.startsWith("/")) {
    return "https://api.groq.com/openai/v1";
  }
  try {
    const parsed = new URL(configuredBaseUrl);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "https://api.groq.com/openai/v1";
  }
}

function getGroqApiKey() {
  return process.env.GROQ_API_KEY?.trim() ?? "";
}

function isTextGroqModel(modelId: string) {
  return !/whisper|tts|speech|audio|ocr|vision/i.test(modelId);
}

function mapGroqModel(model: GroqModelItem): AIModelInfo | null {
  if (!model.id || !model.active || !isTextGroqModel(model.id)) return null;
  return {
    id: model.id,
    label: model.id,
    pricing: "paid",
    contextWindow: model.context_window ?? 0
  };
}

export async function fetchGroqModels() {
  const apiKey = getGroqApiKey();
  if (!apiKey) return [];
  if (groqModelsCache && groqModelsCache.expiresAt > Date.now()) {
    return groqModelsCache.models;
  }
  const baseUrl = getGroqBaseUrl();
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Groq] models.list failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody
    });
    return [];
  }
  const data = (await response.json()) as { data?: GroqModelItem[] };
  const mapped = (data.data ?? []).map(mapGroqModel).filter((model): model is AIModelInfo => Boolean(model));
  groqModelsCache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    models: mapped
  };
  return mapped;
}

export const groqProvider: AIProviderRuntime = {
  id: "groq",
  label: "Groq",
  pricing: "paid",
  models,
  isConfigured: () => Boolean(getGroqApiKey()),
  listModels: () => models,
  generateText: async ({ prompt, model, system }): Promise<AITextResult> => {
    const apiKey = getGroqApiKey();
    const baseUrl = getGroqBaseUrl();
    if (!apiKey) return { provider: "groq" as const, model, text: fallbackText("post", prompt) };
    const started = nowMs();
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system ?? "You write social media posts." },
            { role: "user", content: prompt }
          ],
          temperature: 0.8
        })
      });
      if (!response.ok) throw new Error(`Groq request failed: ${response.status}`);
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() || fallbackText("post", prompt);
      return withLatency(started, {
        provider: "groq" as const,
        model,
        text,
        raw: data,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens
        }
      });
    } catch {
      return withLatency(started, { provider: "groq" as const, model, text: fallbackText("post", prompt) });
    }
  }
};
