import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { AIProviderId } from "@/types/providers";
import type { Platform } from "@/types/post";

const UserSettingsSchema = new Schema(
  {
    defaults: {
      platform: { type: String },
      provider: { type: String },
      model: { type: String },
      tone: { type: String },
      goal: { type: String },
      niche: { type: String }
    },
    ui: {
      pageSize: { type: Number, default: 10 }
    }
  },
  { timestamps: true }
);

export type UserSettingsDocument = InferSchemaType<typeof UserSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
  defaults?: {
    platform?: Platform;
    provider?: AIProviderId;
    model?: string;
    tone?: string;
    goal?: string;
    niche?: string;
  };
};

export const UserSettingsModel: Model<UserSettingsDocument> =
  mongoose.models.UserSettings ?? mongoose.model<UserSettingsDocument>("UserSettings", UserSettingsSchema);
