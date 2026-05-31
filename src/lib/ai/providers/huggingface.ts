import type { AIProviderRuntime } from "../types";
import { fallbackText, nowMs, withLatency, toText } from "../runtime";

const models = [
  { id: "mistralai/Mistral-Nemo-Instruct-2407", label: "Mistral Nemo Instruct", pricing: "free" as const, contextWindow: 128000 },
  { id: "meta-llama/Llama-3.1-8B-Instruct", label: "Llama 3.1 8B Instruct", pricing: "free" as const, contextWindow: 128000 }
];

export const huggingfaceProvider: AIProviderRuntime = {
  id: "huggingface",
  label: "Hugging Face",
  pricing: "free",
  models,
  isConfigured: () => Boolean(process.env.HUGGINGFACE_API_KEY),
  listModels: () => models,
  generateText: async ({ prompt, model, system }) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) return { provider: "huggingface", model, text: fallbackText("post", prompt) };
    const started = nowMs();
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `${system ?? ""}\n${prompt}`.trim(),
          parameters: { temperature: 0.8, return_full_text: false }
        })
      });
      if (!response.ok) throw new Error(`Hugging Face request failed: ${response.status}`);
      const data = (await response.json()) as unknown;
      const text = toText(data).trim() || fallbackText("post", prompt);
      return withLatency(started, {
        provider: "huggingface" as const,
        model,
        text,
        raw: data
      });
    } catch {
      return withLatency(started, { provider: "huggingface" as const, model, text: fallbackText("post", prompt) });
    }
  }
};
