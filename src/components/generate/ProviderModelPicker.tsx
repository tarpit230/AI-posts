"use client";

import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import type { AIModelInfo, ProviderInfo, AIProviderId } from "@/types/providers";
import type { Platform } from "@/types/post";
import { chooseGeminiModel } from "@/lib/ai/gemini-models";

interface Props {
  providers: ProviderInfo[];
  provider: AIProviderId;
  model: string;
  platform?: Platform;
  onProviderChange: (provider: AIProviderId) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ProviderModelPicker({
  providers,
  provider,
  model,
  platform = "x",
  onProviderChange,
  onModelChange,
  disabled
}: Props) {
  const [models, setModels] = useState<AIModelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selected = providers.find((entry) => entry.id === provider);
    if (selected?.models?.length) {
      setModels(selected.models);
      if (!selected.models.some((entry) => entry.id === model)) {
        const nextModel =
          provider === "gemini"
            ? chooseGeminiModel(platform, selected.models, selected.models[0]?.id)
            : selected.models[0].id;
        onModelChange(nextModel);
      }
      return;
    }

    setLoading(true);
    void (async () => {
      const response = await fetch(`/api/models?provider=${provider}`);
      const data = (await response.json()) as { models?: AIModelInfo[] };
      const nextModels = data.models ?? [];
      setModels(nextModels);
      if (!nextModels.some((entry) => entry.id === model) && nextModels[0]) {
        const nextModel =
          provider === "gemini" ? chooseGeminiModel(platform, nextModels, nextModels[0].id) : nextModels[0].id;
        onModelChange(nextModel);
      }
      setLoading(false);
    })();
  }, [model, onModelChange, platform, provider, providers]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="provider">AI provider</Label>
        <Select
          id="provider"
          value={provider}
          onChange={(event) => onProviderChange(event.target.value as AIProviderId)}
          disabled={disabled}
        >
          {providers.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="model">AI model</Label>
        <Select
          id="model"
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          disabled={disabled || loading || models.length === 0}
        >
          {models.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label} - {entry.pricing}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
