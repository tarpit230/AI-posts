import type { Platform } from "@/types/post";

export interface PlatformSpec {
  id: Platform;
  label: string;
  maxLength: number;
  focus: string;
}

export const platformSpecs: Record<Platform, PlatformSpec> = {
  x: {
    id: "x",
    label: "X",
    maxLength: 280,
    focus: "Short, sharp, and scroll-stopping."
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    maxLength: 2200,
    focus: "Visual-first, conversational, and hashtag-friendly."
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    maxLength: 3000,
    focus: "Professional, insightful, and value-driven."
  },
  threads: {
    id: "threads",
    label: "Threads",
    maxLength: 500,
    focus: "Casual, opinionated, and punchy."
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    maxLength: 63206,
    focus: "Friendly, clear, and community-oriented."
  },
  youtube_community: {
    id: "youtube_community",
    label: "YouTube Community",
    maxLength: 1000,
    focus: "Direct, conversational, and engaging."
  }
};
