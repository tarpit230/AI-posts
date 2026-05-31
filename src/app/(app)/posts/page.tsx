import { Card } from "@/components/ui/card";
import { PostsTable } from "@/components/posts/PostsTable";
import { getConfiguredProviderCatalog } from "@/lib/ai/registry";
import { listPosts, getProviderSettings } from "@/lib/db/queries";

export default async function PostsPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; platform?: string; status?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const settings = await getProviderSettings();
  const page = Number(params.page ?? "1");
  const pageSize = settings?.ui?.pageSize ?? 10;
  const result = await listPosts({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize,
    platform: params.platform,
    status: params.status as any,
    q: params.q
  });
  const providers = await getConfiguredProviderCatalog();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Posts</p>
        <h1 className="mt-2 text-3xl font-semibold">Drafts table</h1>
        <p className="mt-2 text-sm text-slate-400">Filter, edit, copy, delete, and mark drafts as posted.</p>
      </div>
      {providers.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">No configured AI providers found. Add an API key or base URL first.</p>
        </Card>
      ) : (
        <PostsTable
          initialItems={result.items}
          initialTotal={result.total}
          pageSize={pageSize}
          initialPage={Number.isFinite(page) && page > 0 ? page : 1}
          initialPlatform={params.platform as any}
          initialStatus={params.status as any}
        />
      )}
    </div>
  );
}
