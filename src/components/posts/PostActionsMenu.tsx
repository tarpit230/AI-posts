"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import type { Platform, PostStatus } from "@/types/post";

interface Props {
  postId: string;
  content: string;
  status: PostStatus;
  platform: Platform;
  onDeleted?: () => void;
}

export function PostActionsMenu({ postId, content, status, platform, onDeleted }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(content);
  }

  async function markPosted() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/posts/${postId}/mark-posted`, { method: "POST" });
      if (!response.ok) {
        setError("Unable to mark the post as posted.");
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function publishToX() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/posts/${postId}/publish`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to publish the post to X.");
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function remove() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Unable to delete the post.");
        return;
      }
      onDeleted?.();
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={copy}>
        Copy
      </Button>
      {platform === "x" && status !== "posted" ? (
        <Button type="button" variant="secondary" onClick={publishToX} disabled={isPending}>
          Publish to X
        </Button>
      ) : null}
      {status !== "posted" ? (
        <Button type="button" variant="outline" onClick={markPosted} disabled={isPending}>
          Mark posted
        </Button>
      ) : null}
      <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
        Delete
      </Button>
      {error ? <p className="w-full text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
