"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { PromptPreview } from "./PromptPreview";
import { ProviderModelPicker } from "./ProviderModelPicker";
import { chooseGeminiModel } from "@/lib/ai/gemini-models";
import type { Platform, PostFormat } from "@/types/post";
import type { ProviderInfo } from "@/types/providers";

const platformOptions: Array<{ value: Platform; label: string }> = [
  { value: "x", label: "X" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "threads", label: "Threads" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube_community", label: "YouTube Community" }
];

const toneOptions = ["Friendly", "Bold", "Professional", "Playful", "Educational", "Persuasive"];
const goalOptions = ["Engagement", "Leads", "Sales", "Awareness", "Traffic", "Community"];

interface Props {
  providers: ProviderInfo[];
  initial: {
    platform: Platform;
    provider: ProviderInfo["id"];
    model: string;
    topic: string;
    niche: string;
    tone: string;
    goal: string;
    postFormat: PostFormat;
  };
}

export function GenerateForm({ providers, initial }: Props) {
  const router = useRouter();
  const selectedProvider = providers.find((entry) => entry.id === initial.provider) ?? providers[0];
  const [platform, setPlatform] = useState<Platform>(initial.platform);
  const [provider, setProvider] = useState(selectedProvider?.id ?? initial.provider);
  const [model, setModel] = useState(
    selectedProvider?.id === "gemini"
      ? chooseGeminiModel(initial.platform, selectedProvider?.models ?? [], initial.model)
      : selectedProvider?.models.find((entry) => entry.id === initial.model)?.id ??
        selectedProvider?.models[0]?.id ??
        initial.model
  );
  const [topic, setTopic] = useState(initial.topic);
  const [niche, setNiche] = useState(initial.niche);
  const [tone, setTone] = useState(initial.tone);
  const [goal, setGoal] = useState(initial.goal);
  const [postFormat, setPostFormat] = useState<PostFormat>(initial.postFormat);
  const [generatedImageAsset, setGeneratedImageAsset] = useState<string>("");
  const [generatedImageAlt, setGeneratedImageAlt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (platform !== "instagram" && postFormat !== "text") {
      setPostFormat("text");
    }
  }, [platform, postFormat]);

  useEffect(() => {
    if (providers.length === 0) return;
    const providerExists = providers.some((entry) => entry.id === provider);
    if (!providerExists) {
      const nextProvider = providers[0];
      setProvider(nextProvider.id);
      setModel(nextProvider.id === "gemini" ? chooseGeminiModel(platform, nextProvider.models) : nextProvider.models[0]?.id ?? "");
      return;
    }
    const currentProvider = providers.find((entry) => entry.id === provider);
    if (currentProvider && !currentProvider.models.some((entry) => entry.id === model)) {
      setModel(
        currentProvider.id === "gemini"
          ? chooseGeminiModel(platform, currentProvider.models, currentProvider.models[0]?.id)
          : currentProvider.models[0]?.id ?? ""
      );
    }
  }, [model, platform, provider, providers]);

  useEffect(() => {
    if (retrySeconds === null) return;
    if (retrySeconds <= 0) {
      setRetrySeconds(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setRetrySeconds((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retrySeconds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRetrySeconds(null);
    setIsPending(true);
    try {
      console.log("[GenerateForm] submit", {
        platform,
        provider,
        model,
        topic,
        niche,
        tone,
        goal,
        postFormat
      });
      const generatedResponse = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, provider, model, topic, niche, tone, goal, postFormat })
      });
      const generatedData = await generatedResponse.json();
      console.log("[GenerateForm] generated response", generatedData);
      if (!generatedResponse.ok) {
        if (generatedData.providerDisabled) {
          router.refresh();
        }
        if (typeof generatedData.retryAfterSeconds === "number") {
          setRetrySeconds(generatedData.retryAfterSeconds);
        }
        throw new Error(generatedData.error ?? "Failed to generate post.");
      }
      if (generatedData.imageAsset) {
        setGeneratedImageAsset(generatedData.imageAsset);
        setGeneratedImageAlt(generatedData.imageAlt ?? `${topic} Instagram image post`);
      }

      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          provider,
          model,
          topic,
          niche,
          tone,
          goal,
          postFormat,
          content: generatedData.content,
          imagePrompt: generatedData.imagePrompt,
          imageAsset: generatedData.imageAsset,
          imageAlt: generatedData.imageAlt,
          hashtags: generatedData.hashtags,
          hook: generatedData.hook,
          cta: generatedData.cta
        })
      });
      const saveData = await saveResponse.json();
      console.log("[GenerateForm] saved post", saveData);
      if (!saveResponse.ok) throw new Error(saveData.error ?? "Failed to save post.");

      if (platform === "x") {
        const publishResponse = await fetch(`/api/posts/${saveData.item._id}/publish`, {
          method: "POST"
        });
        const publishData = await publishResponse.json();
        console.log("[GenerateForm] publish response", publishData);
        if (!publishResponse.ok) {
          throw new Error(`Draft saved, but auto-publish to X failed: ${publishData.error ?? "Unknown error"}`);
        }
      }

      router.push(`/posts/${saveData.item._id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select id="platform" value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>
                {platformOptions.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="What should the post be about?" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="AI, fitness, SaaS..." />
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select id="tone" value={tone} onChange={(event) => setTone(event.target.value)}>
                <option value="">Choose a tone</option>
                {toneOptions.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <Select id="goal" value={goal} onChange={(event) => setGoal(event.target.value)}>
              <option value="">Choose a goal</option>
              {goalOptions.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          </div>

          {platform === "instagram" ? (
            <div>
              <Label htmlFor="postFormat">Instagram format</Label>
              <Select id="postFormat" value={postFormat} onChange={(event) => setPostFormat(event.target.value as PostFormat)}>
                <option value="text">Text post</option>
                <option value="image">Image post</option>
              </Select>
            </div>
          ) : null}

          <ProviderModelPicker
            providers={providers}
            provider={provider}
            model={model}
            platform={platform}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {retrySeconds !== null ? <p className="text-sm text-amber-300">Retry in {retrySeconds} seconds.</p> : null}
          <Button type="submit" disabled={isPending || providers.length === 0}>
            {isPending ? "Generating..." : "Generate post"}
          </Button>
        </form>
      </Card>

      <PromptPreview platform={platform} topic={topic} niche={niche} tone={tone} goal={goal} postFormat={postFormat} />

      {platform === "instagram" && postFormat === "image" && generatedImageAsset ? (
        <Card className="space-y-3 xl:col-span-2">
          <div>
            <p className="text-sm font-medium text-slate-100">Generated image</p>
            <p className="text-sm text-slate-400">{generatedImageAlt || "Preview of the generated Instagram image."}</p>
          </div>
          <img
            src={generatedImageAsset}
            alt={generatedImageAlt || "Generated Instagram image"}
            className="w-full rounded-2xl border border-slate-800"
          />
        </Card>
      ) : null}
    </div>
  );
}
