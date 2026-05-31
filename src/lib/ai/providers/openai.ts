import type { AIProviderRuntime } from "../types";
import { fallbackText, nowMs, withLatency } from "../runtime";

const models = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", pricing: "paid" as const, contextWindow: 128000 },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", pricing: "paid" as const, contextWindow: 128000 },
  { id: "gpt-4.1", label: "GPT-4.1", pricing: "paid" as const, contextWindow: 128000 }
];

async function generateText(prompt: string, model: string, system?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey) return fallbackText("post", prompt);
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
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content?.trim() || fallbackText("post", prompt);
    return withLatency(started, {
      provider: "openai" as const,
      model,
      text,
      raw: data,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens
      }
    });
  } catch {
    return withLatency(started, {
      provider: "openai" as const,
      model,
      text: fallbackText("post", prompt)
    });
  }
}

export const openaiProvider: AIProviderRuntime = {
  id: "openai",
  label: "OpenAI",
  pricing: "paid",
  models,
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  listModels: () => models,
  generateText: async (request) => generateText(request.prompt, request.model, request.system)
};
