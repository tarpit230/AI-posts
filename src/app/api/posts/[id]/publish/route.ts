import { NextResponse } from "next/server";
import { getPost, updatePost } from "@/lib/db/queries";
import { platformSpecs } from "@/lib/platforms/specs";
import { publishPostToX, XPublishError } from "@/lib/x/publish";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (post.platform !== "x") {
    return NextResponse.json({ error: "Only X posts can be auto-published." }, { status: 400 });
  }
  if (post.status === "posted") {
    return NextResponse.json({ item: post, ok: true, skipped: true });
  }
  if (post.content.length > platformSpecs.x.maxLength) {
    return NextResponse.json({ error: `X posts must be ${platformSpecs.x.maxLength} characters or fewer.` }, { status: 400 });
  }

  try {
    const published = await publishPostToX(post.content);
    const updated = await updatePost(id, {
      status: "posted",
      postedAt: new Date().toISOString(),
      externalPlatform: "x",
      externalPostId: published.tweetId,
      externalUrl: published.tweetUrl
    });
    if (!updated) {
      return NextResponse.json({ error: "Post was published but could not be updated locally." }, { status: 500 });
    }
    return NextResponse.json({ item: updated, published });
  } catch (error) {
    if (error instanceof XPublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish post to X." },
      { status: 500 }
    );
  }
}
