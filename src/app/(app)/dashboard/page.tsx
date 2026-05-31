import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateForm } from "@/components/generate/GenerateForm";
import { getConfiguredProviderCatalog } from "@/lib/ai/registry";
import { chooseGeminiModel } from "@/lib/ai/gemini-models";
import type { PostFormat } from "@/types/post";
import { listPosts, getProviderSettings } from "@/lib/db/queries";

export default async function DashboardPage() {
  const providers = await getConfiguredProviderCatalog();
  const settings = await getProviderSettings();
  const recent = await listPosts({
    page: 1,
    pageSize: 3
  });

  const configuredProvider = providers.find((provider) => provider.id === settings?.defaults?.provider) ?? providers[0];
  const configuredModel =
    configuredProvider?.id === "gemini"
      ? chooseGeminiModel((settings?.defaults?.platform as any) ?? "x", configuredProvider?.models ?? [], settings?.defaults?.model)
      : configuredProvider?.models.find((model) => model.id === settings?.defaults?.model)?.id ??
        configuredProvider?.models[0]?.id ??
        "";
  const defaultFormat: PostFormat = (settings?.defaults?.platform as any) === "instagram" ? "image" : "text";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">Generate and manage post drafts</h1>
          <p className="mt-2 text-sm text-slate-400">Create drafts for X, Instagram, LinkedIn, Threads, Facebook, and YouTube Community.</p>
        </div>
        <Link href="/posts" className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700">
          Open posts
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-400">Configured providers</p>
          <p className="mt-2 text-3xl font-semibold">{providers.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Recent drafts</p>
          <p className="mt-2 text-3xl font-semibold">{recent.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Default page size</p>
          <p className="mt-2 text-3xl font-semibold">{settings?.ui?.pageSize ?? 10}</p>
        </Card>
      </div>

      {providers.length > 0 ? (
        <GenerateForm
          providers={providers}
          initial={{
            platform: (settings?.defaults?.platform as any) ?? "x",
            provider: configuredProvider?.id ?? "openai",
            model: configuredModel,
            topic: "",
            niche: settings?.defaults?.niche ?? "",
            tone: settings?.defaults?.tone ?? "",
            goal: settings?.defaults?.goal ?? "",
            postFormat: defaultFormat
          }}
        />
      ) : (
        <Card>
          <p className="text-sm text-slate-400">Add an API key or Ollama base URL in `.env.local` to unlock the generation form.</p>
        </Card>
      )}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent drafts</h2>
          <Badge>{recent.total}</Badge>
        </div>
        <div className="grid gap-3">
          {recent.items.length === 0 ? (
            <p className="text-sm text-slate-400">No drafts yet. Generate your first post above.</p>
          ) : (
            recent.items.map((item) => (
              <Link key={item._id} href={`/posts/${item._id}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500/60">
                <p className="text-sm font-medium text-cyan-300">{item.topic}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.content}</p>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
