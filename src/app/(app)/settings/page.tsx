import { Card } from "@/components/ui/card";
import { ProvidersModelsPanel } from "@/components/settings/ProvidersModelsPanel";
import { getConfiguredProviderCatalog } from "@/lib/ai/registry";
import { getProviderSettings } from "@/lib/db/queries";

export default async function SettingsPage() {
  const providers = await getConfiguredProviderCatalog();
  const settings = await getProviderSettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Providers and models</h1>
        <p className="mt-2 text-sm text-slate-400">Only configured providers appear here. Free, paid, and local models are labeled for quick selection.</p>
      </div>

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Defaults</h2>
        <p className="text-sm text-slate-400">
          Platform: {settings?.defaults?.platform ?? "not set"} - Provider: {settings?.defaults?.provider ?? "not set"} - Model: {settings?.defaults?.model ?? "not set"}
        </p>
        <p className="text-sm text-slate-400">
          Tone: {settings?.defaults?.tone ?? "not set"} - Goal: {settings?.defaults?.goal ?? "not set"} - Niche: {settings?.defaults?.niche ?? "not set"}
        </p>
      </Card>

      <ProvidersModelsPanel providers={providers} />
    </div>
  );
}
