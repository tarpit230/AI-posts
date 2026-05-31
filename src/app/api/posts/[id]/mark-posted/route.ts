import { NextResponse } from "next/server";
import { markPostPosted } from "@/lib/db/queries";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const item = await markPostPosted(id, body.postedAt);
  if (!item) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ item });
}
