import { NextResponse } from "next/server";
import { imageGenerationSchema } from "@/lib/validation/schemas";
import { createInstagramImageAsset } from "@/lib/images/instagram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[API /generate/image] incoming body", body);
    const parsed = imageGenerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid image generation data.", issues: parsed.error.flatten() }, { status: 400 });
    }
    const image = createInstagramImageAsset(parsed.data);
    console.log("[API /generate/image] generated image asset", {
      imageAlt: image.imageAlt,
      size: image.imageAsset.length
    });
    return NextResponse.json(image);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image." },
      { status: 500 }
    );
  }
}
