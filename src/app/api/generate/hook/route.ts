import { NextResponse } from "next/server";
import { generationSchema } from "@/lib/validation/schemas";
import { generateHook } from "@/lib/ai";
import { getPost } from "@/lib/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid generation data.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const content = body.content ?? (body.postId ? (await getPost(body.postId))?.content : parsed.data.topic);
  if (!content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }
  const hook = await generateHook(parsed.data, content);
  return NextResponse.json({ hook });
}
