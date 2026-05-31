import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/registry";
import { providerParamSchema } from "@/lib/validation/schemas";
import { fetchGeminiModels } from "@/lib/ai/providers/gemini";
import { fetchGroqModels } from "@/lib/ai/providers/groq";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = providerParamSchema.safeParse({
    provider: searchParams.get("provider")
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }
  const provider = getProvider(parsed.data.provider);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ models: [] });
  }
  if (provider.id === "gemini") {
    return NextResponse.json({
      provider: provider.id,
      models: await fetchGeminiModels()
    });
  }
  if (provider.id === "groq") {
    return NextResponse.json({
      provider: provider.id,
      models: await fetchGroqModels()
    });
  }
  return NextResponse.json({
    provider: provider.id,
    models: provider.listModels()
  });
}
