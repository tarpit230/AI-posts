import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { Platform, PostStatus } from "@/types/post";
import type { AIProviderId } from "@/types/providers";

const VariationSchema = new Schema(
  {
    content: { type: String, required: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    createdAt: { type: String, required: true }
  },
  { _id: false }
);

const ScoreSchema = new Schema(
  {
    engagement: { type: Number, required: true, min: 1, max: 100 },
    monetization: { type: Number, required: true, min: 1, max: 100 },
    explanation: { type: String },
    computedAt: { type: String, required: true }
  },
  { _id: false }
);

const PostDraftSchema = new Schema(
  {
    platform: { type: String, required: true, index: true },
    status: { type: String, required: true, default: "draft", index: true },
    topic: { type: String, required: true },
    niche: { type: String },
    tone: { type: String },
    goal: { type: String },
    postFormat: { type: String, default: "text" },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    content: { type: String, required: true },
    imagePrompt: { type: String },
    imageAsset: { type: String },
    imageAlt: { type: String },
    externalPlatform: { type: String },
    externalPostId: { type: String },
    externalUrl: { type: String },
    hashtags: { type: [String], default: [] },
    hook: { type: String },
    cta: { type: String },
    variations: { type: [VariationSchema], default: [] },
    scores: { type: ScoreSchema },
    meta: {
      promptVersion: { type: String, required: true, default: "v1" },
      inputTokens: { type: Number },
      outputTokens: { type: Number },
      latencyMs: { type: Number }
    },
    postedAt: { type: String }
  },
  { timestamps: true }
);

PostDraftSchema.index({ platform: 1, status: 1, createdAt: -1 });

export type PostDraftDocument = InferSchemaType<typeof PostDraftSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  platform: Platform;
  status: PostStatus;
  provider: AIProviderId;
};

export const PostDraftModel: Model<PostDraftDocument> =
  mongoose.models.PostDraft ?? mongoose.model<PostDraftDocument>("PostDraft", PostDraftSchema);
