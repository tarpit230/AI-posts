import type { AIModelInfo, AIProviderId, AIRequestBase, AITextResult } from "./types";
import { scoreContent } from "../scoring/heuristics";

export function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function withLatency<T extends object>(start: number, result: T): T & { latencyMs: number } {
  const end = nowMs();
  return {
    ...(result as object),
    latencyMs: Math.round(end - start)
  } as T & { latencyMs: number };
}

export function fallbackText(action: string, prompt: string) {
  const topicLine =
    prompt
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /^Topic:\s*/i.test(line)) ??
    prompt
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /^Content:\s*/i.test(line)) ??
    "your topic";
  const topic = topicLine.replace(/^Topic:\s*/i, "").replace(/^Content:\s*/i, "");
  if (action === "hashtags") {
    return "#ai #contentcreator #socialmedia #growth #marketing";
  }
  if (action === "hook") {
    return `Want a smarter way to talk about ${topic}?`;
  }
  if (action === "cta") {
    return "What would you add here? Share your take in the comments.";
  }
  if (action === "variations") {
    return [
      `Variation 1: A cleaner take on ${topic}.`,
      `Variation 2: A bolder take on ${topic}.`,
      `Variation 3: A more conversational take on ${topic}.`
    ].join("\n\n");
  }
  if (action === "score") {
    const score = scoreContent({ platform: "x", content: prompt });
    return JSON.stringify(score);
  }
  return `Here is a polished draft about ${topic} with a strong hook, clear body, and CTA.`;
}

export function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(toText).join("\n");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (Array.isArray(record.content)) return record.content.map(toText).join("\n");
    if (typeof record.generated_text === "string") return record.generated_text;
    if (typeof record.generatedText === "string") return record.generatedText;
  }
  return "";
}

export function extractHashtags(text: string, count = 5) {
  const tags = text
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9_#]/g, ""))
    .filter((word) => /^#?[a-z0-9_]+$/i.test(word))
    .map((word) => (word.startsWith("#") ? word : `#${word}`));
  return Array.from(new Set(tags)).slice(0, count);
}

export function extractLines(text: string, limit = 5) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function modelById(models: AIModelInfo[], model: string) {
  return models.find((entry) => entry.id === model) ?? models[0];
}

export function buildMessagePrompt(base: AIRequestBase) {
  return [base.system, base.prompt].filter(Boolean).join("\n\n");
}

export function emptyTextResult(provider: AIProviderId, model: string, text: string): AITextResult {
  return { provider, model, text };
}
