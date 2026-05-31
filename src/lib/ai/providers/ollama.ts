import type { AIProviderRuntime } from "../types";
import type { AITextResult } from "../types";
import { fallbackText, nowMs, withLatency } from "../runtime";

const models = [
  { id: "llama3.1", label: "Llama 3.1", pricing: "local" as const, contextWindow: 128000 },
  { id: "qwen2.5", label: "Qwen 2.5", pricing: "local" as const, contextWindow: 128000 },
  { id: "mistral", label: "Mistral", pricing: "local" as const, contextWindow: 32768 }
];

export const ollamaProvider: AIProviderRuntime = {
  id: "ollama",
  label: "Ollama",
  pricing: "local",
  models,
  isConfigured: () => Boolean(process.env.OLLAMA_BASE_URL),
  listModels: () => models,
  generateText: async ({ prompt, model, system }): Promise<AITextResult> => {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    if (!baseUrl) return { provider: "ollama" as const, model, text: fallbackText("post", prompt) };
    const started = nowMs();
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: system ?? "You write social media posts." },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!response.ok) throw new Error(`Ollama request failed: ${response.status}`);
      const data = (await response.json()) as {
        message?: { content?: string };
        eval_count?: number;
        prompt_eval_count?: number;
      };
      const text = data.message?.content?.trim() || fallbackText("post", prompt);
      return withLatency(started, {
        provider: "ollama" as const,
        model,
        text,
        raw: data,
        usage: {
          inputTokens: data.prompt_eval_count,
          outputTokens: data.eval_count
        }
      });
    } catch {
      return withLatency(started, { provider: "ollama" as const, model, text: fallbackText("post", prompt) });
    }
  }
};
