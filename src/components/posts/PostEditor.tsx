"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ProviderModelPicker } from "../generate/ProviderModelPicker";
import { PostActionsMenu } from "./PostActionsMenu";
import { PlatformBadge } from "./PlatformBadge";
import { chooseGeminiModel } from "@/lib/ai/gemini-models";
import type { PostDraft, PostFormat } from "@/types/post";
import type { ProviderInfo } from "@/types/providers";
import Image from "next/image";

const toneOptions = ["", "Friendly", "Bold", "Professional", "Playful", "Educational", "Persuasive"];
const goalOptions = ["", "Engagement", "Leads", "Sales", "Awareness", "Traffic", "Community"];

export function PostEditor({ post, providers }: { post: PostDraft; providers: ProviderInfo[] }) {
  const router = useRouter();
  const selectedProvider = providers.find((entry) => entry.id === post.provider) ?? providers[0];
  const [platform, setPlatform] = useState(post.platform);
  const [provider, setProvider] = useState(selectedProvider?.id ?? post.provider);
  const [model, setModel] = useState(
    selectedProvider?.id === "gemini"
      ? chooseGeminiModel(post.platform, selectedProvider?.models ?? [], post.model)
      : selectedProvider?.models.find((entry) => entry.id === post.model)?.id ??
        selectedProvider?.models[0]?.id ??
        post.model
  );
  const [topic, setTopic] = useState(post.topic);
  const [niche, setNiche] = useState(post.niche ?? "");
  const [tone, setTone] = useState(post.tone ?? "");
  const [goal, setGoal] = useState(post.goal ?? "");
  const [postFormat, setPostFormat] = useState<PostFormat>(post.postFormat ?? "text");
  const [content, setContent] = useState(post.content);
  const [imagePrompt, setImagePrompt] = useState(post.imagePrompt ?? "");
  const [imageAsset, setImageAsset] = useState(post.imageAsset ?? "");
  const [imageAlt, setImageAlt] = useState(post.imageAlt ?? "");
  const [hashtags, setHashtags] = useState(post.hashtags.join(", "));
  const [hook, setHook] = useState(post.hook ?? "");
  const [cta, setCta] = useState(post.cta ?? "");
  const [variations, setVariations] = useState(post.variations.map((variation) => variation.content).join("\n\n"));
  const [score, setScore] = useState(post.scores);
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

  async function save() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
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
          content,
          imagePrompt: platform === "instagram" && postFormat === "image" ? imagePrompt : undefined,
          imageAsset: platform === "instagram" && postFormat === "image" ? imageAsset : undefined,
          imageAlt: platform === "instagram" && postFormat === "image" ? imageAlt : undefined,
          hashtags: hashtags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          hook,
          cta
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to save post.");
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function generate(action: "variations" | "hashtags" | "hook" | "cta") {
    setError(null);
    setRetrySeconds(null);
    const response = await fetch(`/api/generate/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post._id,
        platform,
        provider,
        model,
        topic,
        niche,
        tone,
        goal,
        postFormat,
        content
        })
    });
    const data = await response.json();
    if (!response.ok) {
      if (typeof data.retryAfterSeconds === "number") {
        setRetrySeconds(data.retryAfterSeconds);
      }
      setError(data.error ?? `Unable to generate ${action}.`);
      return;
    }
    if (action === "variations") setVariations(data.variations.join("\n\n"));
    if (action === "hashtags") setHashtags(data.hashtags.join(", "));
    if (action === "hook") setHook(data.hook);
    if (action === "cta") setCta(data.cta);
  }

  async function regenerateImagePrompt() {
    setError(null);
    setRetrySeconds(null);
    const response = await fetch("/api/generate/post", {
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
        content
      })
    });
    const data = await response.json();
    if (!response.ok) {
      if (typeof data.retryAfterSeconds === "number") {
        setRetrySeconds(data.retryAfterSeconds);
      }
      setError(data.error ?? "Unable to generate image prompt.");
      return;
    }
    if (data.imagePrompt) {
      setImagePrompt(data.imagePrompt);
    }
  }

  async function generateImageAsset() {
    setError(null);
    setRetrySeconds(null);
    const response = await fetch("/api/generate/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        topic,
        content,
        imagePrompt,
        niche,
        tone,
        goal
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to generate image.");
      return;
    }
    if (data.imageAsset) {
      setImageAsset(data.imageAsset);
      setImageAlt(data.imageAlt ?? `${topic} Instagram image post`);
      await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageAsset: data.imageAsset,
          imageAlt: data.imageAlt ?? `${topic} Instagram image post`
        })
      });
      router.refresh();
    }
  }

  async function refreshScore() {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, content, niche, goal })
    });
    const data = await response.json();
    if (response.ok) {
      setScore(data.score);
      await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: data.score })
      });
      router.refresh();
      return data;
    }
    setError(data.error ?? "Unable to score post.");
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={platform} />
              <Badge>{post.status}</Badge>
              <Badge>{postFormat === "image" ? "Image post" : "Text post"}</Badge>
            </div>
            <h2 className="text-2xl font-semibold">Edit draft</h2>
            {post.externalUrl ? (
              <a href={post.externalUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:underline">
                View published X post
              </a>
            ) : null}
          </div>
          <PostActionsMenu postId={post._id} content={content} status={post.status} platform={platform} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select id="platform" value={platform} onChange={(event) => setPlatform(event.target.value as typeof platform)}>
              <option value="x">X</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="threads">Threads</option>
              <option value="facebook">Facebook</option>
              <option value="youtube_community">YouTube Community</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="niche">Niche</Label>
            <Input id="niche" value={niche} onChange={(event) => setNiche(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select id="tone" value={tone} onChange={(event) => setTone(event.target.value)}>
              {toneOptions.map((entry) => (
                <option key={entry} value={entry}>
                  {entry || "Choose a tone"}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="goal">Goal</Label>
          <Select id="goal" value={goal} onChange={(event) => setGoal(event.target.value)}>
            {goalOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry || "Choose a goal"}
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

        {providers.length > 0 ? (
          <ProviderModelPicker
            providers={providers}
            provider={provider}
            model={model}
            platform={platform}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            No configured providers are available right now. Add a key or base URL in `.env.local` to change the model.
          </div>
        )}

        <div>
          <Label htmlFor="content">{platform === "instagram" && postFormat === "image" ? "Caption" : "Content"}</Label>
          <Textarea id="content" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-[240px]" />
        </div>

        {platform === "instagram" && postFormat === "image" ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="imagePrompt">Image prompt</Label>
              <Textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(event) => setImagePrompt(event.target.value)}
                className="min-h-[180px]"
                placeholder="Describe the image to generate..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Generated image</Label>
                <Button type="button" variant="secondary" onClick={generateImageAsset}>
                  {imageAsset ? "Regenerate image" : "Generate image"}
                </Button>
              </div>
              {imageAsset ? (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <Image
                    src={imageAsset}
                    alt={imageAlt || `${topic} Instagram image post`}
                    width={1080}
                    height={1080}
                    className="h-auto w-full"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-3 text-sm text-slate-400">
                    <span>{imageAlt || `${topic} Instagram image post`}</span>
                    <a
                      href={imageAsset}
                      download={`${topic.toLowerCase().replace(/\s+/g, "-") || "instagram"}-post.svg`}
                      className="rounded-xl border border-slate-700 px-3 py-2 text-slate-100 transition hover:bg-slate-800"
                    >
                      Download image
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Generate a real image asset for this Instagram draft.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="hashtags">Hashtags</Label>
            <Textarea id="hashtags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} className="min-h-[120px]" />
          </div>
          <div>
            <Label htmlFor="hook">Hook</Label>
            <Textarea id="hook" value={hook} onChange={(event) => setHook(event.target.value)} className="min-h-[120px]" />
          </div>
          <div>
            <Label htmlFor="cta">CTA</Label>
            <Textarea id="cta" value={cta} onChange={(event) => setCta(event.target.value)} className="min-h-[120px]" />
          </div>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {retrySeconds !== null ? <p className="text-sm text-amber-300">Retry in {retrySeconds} seconds.</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={isPending}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => generate("hook")}>
            Generate hook
          </Button>
          <Button type="button" variant="secondary" onClick={() => generate("cta")}>
            Generate CTA
          </Button>
          <Button type="button" variant="secondary" onClick={() => generate("hashtags")}>
            Generate hashtags
          </Button>
          <Button type="button" variant="secondary" onClick={() => generate("variations")}>
            Generate variations
          </Button>
          {platform === "instagram" && postFormat === "image" ? (
            <Button type="button" variant="secondary" onClick={regenerateImagePrompt}>
              Generate image prompt
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={refreshScore}>
            Refresh score
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Scores</h3>
        {score ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Engagement</p>
              <p className="text-3xl font-semibold">{score.engagement}/100</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Monetization</p>
              <p className="text-3xl font-semibold">{score.monetization}/100</p>
            </div>
            {score.explanation ? <p className="md:col-span-2 text-sm text-slate-400">{score.explanation}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No score available yet.</p>
        )}

        <div>
          <h3 className="mb-2 text-lg font-semibold">Variations</h3>
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            {variations || "No variations generated yet."}
          </pre>
        </div>
      </Card>
    </div>
  );
}
