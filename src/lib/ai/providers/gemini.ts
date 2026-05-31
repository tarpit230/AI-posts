import type { AIProviderRuntime } from "../types";
import { nowMs, withLatency } from "../runtime";

const models = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", pricing: "free" as const, contextWindow: 1000000 },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", pricing: "free" as const, contextWindow: 1000000 },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", pricing: "free" as const, contextWindow: 1000000 }
];

type GeminiModelItem = {
  name?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

let geminiDisabledUntil = 0;
let geminiModelsCache: { expiresAt: number; models: typeof models } | null = null;

export class GeminiProviderError extends Error {
  status: number;
  retryAfterSeconds?: number;
  disableProvider: boolean;

  constructor(message: string, options: { status: number; retryAfterSeconds?: number; disableProvider?: boolean }) {
    super(message);
    this.name = "GeminiProviderError";
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.disableProvider = options.disableProvider ?? false;
  }
}

function extractRetryAfterSeconds(errorBody: string) {
  const retryMatch = errorBody.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  return retryMatch ? Number(retryMatch[1]) : undefined;
}

function setGeminiDisabled(retryAfterSeconds?: number) {
  if (!retryAfterSeconds) return;
  geminiDisabledUntil = Date.now() + retryAfterSeconds * 1000;
}

export function isGeminiTemporarilyDisabled() {
  return geminiDisabledUntil > Date.now();
}

function getGeminiApiVersion(model: string) {
  return model.startsWith("gemini-1.5") ? "v1" : "v1beta";
}

function isUsableGeminiModel(model: GeminiModelItem) {
  const name = model.name ?? "";
  const supportedMethods = model.supportedGenerationMethods ?? [];
  return name.startsWith("models/gemini-") && supportedMethods.includes("generateContent");
}

function mapGeminiModel(model: GeminiModelItem) {
  const name = model.name ?? "";
  const id = name.replace(/^models\//, "");
  const displayName = model.displayName ?? id;
  const inputTokenLimit = model.inputTokenLimit ?? 0;
  return {
    id,
    label: displayName,
    pricing: id.includes("flash") ? ("free" as const) : ("paid" as const),
    contextWindow: inputTokenLimit || 1000000
  };
}

export async function fetchGeminiModels() {
  if (!process.env.GEMINI_API_KEY) return [];
  if (geminiModelsCache && geminiModelsCache.expiresAt > Date.now()) {
    return geminiModelsCache.models;
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Gemini] models.list failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody
    });
    return [];
  }
  const data = (await response.json()) as { models?: GeminiModelItem[] };
  const mapped = (data.models ?? []).filter(isUsableGeminiModel).map(mapGeminiModel);
  geminiModelsCache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    models: mapped
  };
  return mapped;
}

export const geminiProvider: AIProviderRuntime = {
  id: "gemini",
  label: "Gemini",
  pricing: "free",
  models,
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY) && !isGeminiTemporarilyDisabled(),
  listModels: () => models,
  generateText: async ({ prompt, model, system }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiProviderError("Gemini API key is missing.", { status: 400 });
    }
    if (isGeminiTemporarilyDisabled()) {
      throw new GeminiProviderError("Gemini is temporarily disabled because the quota was exceeded.", {
        status: 429,
        disableProvider: true
      });
    }
    const started = nowMs();
    try {
      console.log("[Gemini] request", {
        model,
        system,
        prompt
      });
      const apiVersion = getGeminiApiVersion(model);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }]
              }
            ],
            generationConfig: { temperature: 0.8 }
          })
        }
      );
      if (!response.ok) {
        const errorBody = await response.text();
        const retryAfterSeconds = extractRetryAfterSeconds(errorBody);
        if (response.status === 429) {
          setGeminiDisabled(retryAfterSeconds);
        }
        console.error("[Gemini] non-200 response", {
          apiVersion,
          status: response.status,
          statusText: response.statusText,
          retryAfterSeconds,
          errorBody
        });
        throw new GeminiProviderError(`Gemini request failed: ${response.status} ${response.statusText}`, {
          status: response.status,
          retryAfterSeconds,
          disableProvider: response.status === 429
        });
      }
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
      if (!text) {
        throw new GeminiProviderError("Gemini returned an empty response.", { status: 502 });
      }
      console.log("[Gemini] raw response", data);
      console.log("[Gemini] extracted text", text);
      return withLatency(started, {
        provider: "gemini" as const,
        model,
        text,
        raw: data,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount,
          outputTokens: data.usageMetadata?.candidatesTokenCount
        }
      });
    } catch (error) {
      if (error instanceof GeminiProviderError) {
        throw error;
      }
      console.error("[Gemini] request failed", error);
      throw new GeminiProviderError("Gemini request failed.", { status: 500 });
    }
  }
};
