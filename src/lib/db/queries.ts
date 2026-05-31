import { Types } from "mongoose";
import { PostDraftModel } from "./models/PostDraft";
import { UserSettingsModel } from "./models/UserSettings";
import { connectMongo, isMongoConfigured } from "./mongoose";
import type { Platform, PostDraft, PostStatus, PostScore } from "@/types/post";
import type { AIProviderId } from "@/types/providers";
import { scoreContent } from "../scoring/heuristics";

type LeanVariationDoc = {
  content?: string | null;
  provider?: AIProviderId | null;
  model?: string | null;
  createdAt?: string | Date | null;
};

type LeanPostDraftDoc = {
  _id: { toString: () => string };
  platform: Platform;
  status: PostStatus;
  topic: string;
  niche?: string | null;
  tone?: string | null;
  goal?: string | null;
  postFormat?: string | null;
  provider: AIProviderId;
  model: string;
  content: string;
  imagePrompt?: string | null;
  imageAsset?: string | null;
  imageAlt?: string | null;
  externalPlatform?: string | null;
  externalPostId?: string | null;
  externalUrl?: string | null;
  postedAt?: string | Date | null;
  hashtags?: string[] | null;
  hook?: string | null;
  cta?: string | null;
  variations?: LeanVariationDoc[] | null;
  scores?: {
    engagement: number;
    monetization: number;
    explanation?: string | null;
    computedAt: string;
  } | null;
  meta?: {
    promptVersion?: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  } | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toPostFormat(value: unknown) {
  return value === "image" ? "image" : "text";
}

function toIsoString(value: Date | string | undefined) {
  if (value instanceof Date) return value.toISOString();
  return value ?? new Date().toISOString();
}

function toPostDraft(doc: LeanPostDraftDoc): PostDraft {
  return {
    _id: doc._id.toString(),
    platform: doc.platform,
    status: doc.status,
    topic: doc.topic,
    niche: toStringOrUndefined(doc.niche),
    tone: toStringOrUndefined(doc.tone),
    goal: toStringOrUndefined(doc.goal),
    postFormat: toPostFormat(doc.postFormat),
    provider: doc.provider,
    model: doc.model,
    content: doc.content,
    imagePrompt: toStringOrUndefined(doc.imagePrompt),
    imageAsset: toStringOrUndefined(doc.imageAsset),
    imageAlt: toStringOrUndefined(doc.imageAlt),
    externalPlatform: doc.externalPlatform === "x" ? "x" : undefined,
    externalPostId: toStringOrUndefined(doc.externalPostId),
    externalUrl: toStringOrUndefined(doc.externalUrl),
    postedAt:
      typeof doc.postedAt === "string"
        ? doc.postedAt
        : doc.postedAt instanceof Date
          ? doc.postedAt.toISOString()
          : undefined,
    hashtags: doc.hashtags ?? [],
    hook: toStringOrUndefined(doc.hook),
    cta: toStringOrUndefined(doc.cta),
    variations: (doc.variations ?? []).map((variation) => ({
      content: variation.content ?? "",
      provider: variation.provider ?? "openai",
      model: variation.model ?? "",
      createdAt:
        typeof variation.createdAt === "string"
          ? variation.createdAt
          : variation.createdAt instanceof Date
            ? variation.createdAt.toISOString()
            : new Date().toISOString()
    })),
    scores: doc.scores
      ? {
          engagement: doc.scores.engagement,
          monetization: doc.scores.monetization,
          explanation: toStringOrUndefined(doc.scores.explanation),
          computedAt: doc.scores.computedAt
        }
      : undefined,
    meta: {
      promptVersion: doc.meta?.promptVersion ?? "v1",
      inputTokens: doc.meta?.inputTokens,
      outputTokens: doc.meta?.outputTokens,
      latencyMs: doc.meta?.latencyMs
    },
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt)
  };
}

export async function getProviderSettings() {
  if (!isMongoConfigured()) return null;
  await connectMongo();
  const settings = await UserSettingsModel.findOne().lean();
  return settings ?? null;
}

export async function upsertProviderSettings(input: {
  defaults?: {
    platform?: Platform;
    provider?: AIProviderId;
    model?: string;
    tone?: string;
    goal?: string;
    niche?: string;
  };
  ui?: {
    pageSize?: number;
  };
}) {
  await connectMongo();
  const existing = await UserSettingsModel.findOne();
  if (existing) {
    existing.defaults = {
      ...existing.defaults,
      ...input.defaults
    };
    existing.ui = {
      pageSize: input.ui?.pageSize ?? existing.ui?.pageSize ?? 10
    };
    await existing.save();
    return existing.toObject();
  }
  const created = await UserSettingsModel.create(input);
  return created.toObject();
}

export async function listPosts(params: {
  page: number;
  pageSize: number;
  platform?: string;
  status?: PostStatus;
  q?: string;
}) {
  if (!isMongoConfigured()) {
    return { items: [], total: 0 };
  }
  await connectMongo();
  const filter: Record<string, unknown> = {};
  if (params.platform) filter.platform = params.platform;
  if (params.status) filter.status = params.status;
  if (params.q) {
    const regex = new RegExp(params.q, "i");
    filter.$or = [{ topic: regex }, { content: regex }, { imagePrompt: regex }, { niche: regex }, { goal: regex }];
  }
  const [items, total] = await Promise.all([
    PostDraftModel.find(filter).sort({ createdAt: -1 }).skip((params.page - 1) * params.pageSize).limit(params.pageSize).lean(),
    PostDraftModel.countDocuments(filter)
  ]);
  return { items: items.map((item) => toPostDraft(item as LeanPostDraftDoc)), total };
}

export async function getPost(id: string) {
  if (!Types.ObjectId.isValid(id) || !isMongoConfigured()) return null;
  await connectMongo();
  const doc = await PostDraftModel.findById(id).lean();
  return doc ? toPostDraft(doc as LeanPostDraftDoc) : null;
}

export async function createPost(input: {
  platform: string;
  topic: string;
  niche?: string;
  tone?: string;
  goal?: string;
  postFormat?: string;
  provider: AIProviderId;
  model: string;
  content: string;
  imagePrompt?: string;
  imageAsset?: string;
  imageAlt?: string;
  hashtags?: string[];
  hook?: string;
  cta?: string;
  scores?: PostScore;
  meta?: Record<string, unknown>;
}) {
  await connectMongo();
  const score = input.scores ?? scoreContent({
    platform: input.platform as Platform,
    content: input.content,
    niche: input.niche,
    goal: input.goal
  });
  const created = await PostDraftModel.create({
    ...input,
    status: "draft",
    hashtags: input.hashtags ?? [],
    scores: score,
    meta: {
      promptVersion: "v1",
      ...input.meta
    }
  });
  return toPostDraft(created.toObject() as LeanPostDraftDoc);
}

export async function updatePost(id: string, updates: Partial<PostDraft>) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectMongo();
  const doc = await PostDraftModel.findById(id);
  if (!doc) return null;
  Object.assign(doc, updates);
  if (updates.content || updates.goal || updates.niche || updates.platform) {
    doc.scores = scoreContent({
      platform: doc.platform as Platform,
      content: doc.content,
      niche: toStringOrUndefined(doc.niche),
      goal: toStringOrUndefined(doc.goal)
    });
  }
  await doc.save();
  return toPostDraft(doc.toObject() as LeanPostDraftDoc);
}

export async function deletePost(id: string) {
  if (!Types.ObjectId.isValid(id)) return false;
  await connectMongo();
  const deleted = await PostDraftModel.findByIdAndDelete(id);
  return Boolean(deleted);
}

export async function markPostPosted(id: string, postedAt = new Date().toISOString()) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectMongo();
  const updated = await PostDraftModel.findByIdAndUpdate(
    id,
    { status: "posted", postedAt },
    { new: true }
  ).lean();
  return updated ? toPostDraft(updated as LeanPostDraftDoc) : null;
}
