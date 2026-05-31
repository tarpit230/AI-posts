import { notFound } from "next/navigation";
import { PostEditor } from "@/components/posts/PostEditor";
import { getPost } from "@/lib/db/queries";
import { getConfiguredProviderCatalog } from "@/lib/ai/registry";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    notFound();
  }
  const providers = await getConfiguredProviderCatalog();
  return <PostEditor post={post} providers={providers} />;
}
