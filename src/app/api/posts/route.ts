import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/db/queries";
import { postDraftSchema, postQuerySchema } from "@/lib/validation/schemas";
import { generatePostDraft } from "@/lib/ai";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = postQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }
  const data = await listPosts(parsed.data);
  return NextResponse.json({
    items: data.items,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
    total: data.total
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid post data.", issues: parsed.error.flatten() }, { status: 400 });
    }
    const draft = await createPost(parsed.data);
    return NextResponse.json({ item: draft }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post." },
      { status: 500 }
    );
  }
}
