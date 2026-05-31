import type { AIProviderRuntime } from "../types";
import type { AITextResult } from "../types";
import { fallbackText, nowMs, withLatency } from "../runtime";

const models = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", pricing: "paid" as const, contextWindow: 128000 },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", pricing: "paid" as const, contextWindow: 200000 },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B Instruct", pricing: "paid" as const, contextWindow: 128000 }
];

export const openrouterProvider: AIProviderRuntime = {
  id: "openrouter",
  label: "OpenRouter",
  pricing: "paid",
  models,
  isConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
  listModels: () => models,
  generateText: async ({ prompt, model, system }): Promise<AITextResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
    if (!apiKey) return { provider: "openrouter" as const, model, text: fallbackText("post", prompt) };
    const started = nowMs();
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
          "X-Title": process.env.OPENROUTER_APP_NAME ?? "AI Posts"
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
      if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status}`);
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() || fallbackText("post", prompt);
      return withLatency(started, {
        provider: "openrouter" as const,
        model,
        text,
        raw: data,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens
        }
      });
    } catch {
      return withLatency(started, { provider: "openrouter" as const, model, text: fallbackText("post", prompt) });
    }
  }
};
