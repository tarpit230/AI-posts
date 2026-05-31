import { Types } from "mongoose";
import { PostDraftModel } from "./models/PostDraft";
import { UserSettingsModel } from "./models/UserSettings";
import { connectMongo, isMongoConfigured } from "./mongoose";
import type { PostDraft, PostFormValues, PostStatus, PostScore } from "@/types/post";
import type { AIProviderId } from "@/types/providers";
import { scoreContent } from "../scoring/heuristics";

function toPostDraft(doc: any): PostDraft {
  return {
    _id: doc._id.toString(),
    platform: doc.platform,
    status: doc.status,
    topic: doc.topic,
    niche: doc.niche,
    tone: doc.tone,
    goal: doc.goal,
    postFormat: doc.postFormat ?? "text",
    provider: doc.provider,
    model: doc.model,
    content: doc.content,
    imagePrompt: doc.imagePrompt,
    imageAsset: doc.imageAsset,
    imageAlt: doc.imageAlt,
    externalPlatform: doc.externalPlatform,
    externalPostId: doc.externalPostId,
    externalUrl: doc.externalUrl,
    hashtags: doc.hashtags ?? [],
    hook: doc.hook,
    cta: doc.cta,
    variations: (doc.variations ?? []).map((variation: any) => ({
      content: variation.content,
      provider: variation.provider,
      model: variation.model,
      createdAt: variation.createdAt
    })),
    scores: doc.scores
      ? {
          engagement: doc.scores.engagement,
          monetization: doc.scores.monetization,
          explanation: doc.scores.explanation,
          computedAt: doc.scores.computedAt
        }
      : undefined,
    meta: doc.meta ?? { promptVersion: "v1" },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt
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
    platform?: string;
    provider?: string;
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
    existing.ui = { ...existing.ui, ...input.ui };
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
  return { items: items.map(toPostDraft), total };
}

export async function getPost(id: string) {
  if (!Types.ObjectId.isValid(id) || !isMongoConfigured()) return null;
  await connectMongo();
  const doc = await PostDraftModel.findById(id).lean();
  return doc ? toPostDraft(doc) : null;
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
    platform: input.platform as any,
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
  return toPostDraft(created.toObject());
}

export async function updatePost(id: string, updates: Partial<PostDraft>) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectMongo();
  const doc = await PostDraftModel.findById(id);
  if (!doc) return null;
  Object.assign(doc, updates);
  if (updates.content || updates.goal || updates.niche || updates.platform) {
    doc.scores = scoreContent({
      platform: doc.platform as any,
      content: doc.content,
      niche: doc.niche,
      goal: doc.goal
    });
  }
  await doc.save();
  return toPostDraft(doc.toObject());
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
  return updated ? toPostDraft(updated) : null;
}
