import type { AIProviderRuntime } from "../types";
import { fallbackText, nowMs, withLatency } from "../runtime";

const models = [
  { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet", pricing: "paid" as const, contextWindow: 200000 },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", pricing: "paid" as const, contextWindow: 200000 }
];

export const anthropicProvider: AIProviderRuntime = {
  id: "anthropic",
  label: "Anthropic",
  pricing: "paid",
  models,
  isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  listModels: () => models,
  generateText: async ({ prompt, model, system }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { provider: "anthropic", model, text: fallbackText("post", prompt) };
    const started = nowMs();
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_tokens: 900,
          temperature: 0.8,
          system: system ?? "You write concise, useful social media posts.",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!response.ok) throw new Error(`Anthropic request failed: ${response.status}`);
      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = data.content?.map((part) => part.text ?? "").join("").trim() || fallbackText("post", prompt);
      return withLatency(started, {
        provider: "anthropic" as const,
        model,
        text,
        raw: data,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens
        }
      });
    } catch {
      return withLatency(started, { provider: "anthropic" as const, model, text: fallbackText("post", prompt) });
    }
  }
};
