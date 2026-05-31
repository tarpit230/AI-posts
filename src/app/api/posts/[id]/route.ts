import { NextResponse } from "next/server";
import { deletePost, getPost, updatePost } from "@/lib/db/queries";
import { postPatchSchema } from "@/lib/validation/schemas";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getPost(id);
  if (!item) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = postPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update data.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const item = await updatePost(id, parsed.data);
  if (!item) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
