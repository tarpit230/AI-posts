import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { ProviderInfo } from "@/types/providers";

export function ProvidersModelsPanel({ providers }: { providers: ProviderInfo[] }) {
  if (providers.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400">No AI providers are configured yet. Add an API key or Ollama base URL in `.env.local`.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {providers.map((provider) => (
        <Card key={provider.id} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{provider.label}</h3>
              <p className="text-sm text-slate-400">{provider.pricing}</p>
            </div>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">Configured</Badge>
          </div>
          <div className="space-y-2">
            {provider.models.map((model) => (
              <div key={model.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{model.label}</p>
                  <p className="text-xs text-slate-400">{model.id}</p>
                </div>
                <Badge>{model.pricing}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
