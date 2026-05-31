import { NextResponse } from "next/server";
import { getConfiguredProviderCatalog } from "@/lib/ai/registry";

export async function GET() {
  const providers = await getConfiguredProviderCatalog();
  return NextResponse.json({
    providers: providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
      configured: true,
      pricing: provider.pricing,
      models: provider.models
    }))
  });
}
