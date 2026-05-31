import { NextResponse } from "next/server";
import { generationSchema } from "@/lib/validation/schemas";
import { generatePostDraft } from "@/lib/ai";
import { GeminiProviderError } from "@/lib/ai/providers/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[API /generate/post] incoming body", body);
    const parsed = generationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid generation data.", issues: parsed.error.flatten() }, { status: 400 });
    }
    const draft = await generatePostDraft(parsed.data);
    console.log("[API /generate/post] generated draft", draft);
    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof GeminiProviderError) {
      return NextResponse.json(
        {
          error: error.message,
          provider: "gemini",
          retryAfterSeconds: error.retryAfterSeconds,
          providerDisabled: error.disableProvider
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate post." },
      { status: 500 }
    );
  }
}
