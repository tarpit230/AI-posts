"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { PlatformBadge } from "./PlatformBadge";
import type { PostDraft, PostStatus, Platform } from "@/types/post";

interface Props {
  initialItems: PostDraft[];
  initialTotal: number;
  pageSize: number;
  initialPage?: number;
  initialPlatform?: Platform;
  initialStatus?: PostStatus;
}

export function PostsTable({
  initialItems,
  initialTotal,
  pageSize,
  initialPage = 1,
  initialPlatform,
  initialStatus
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [platform, setPlatform] = useState<string>(initialPlatform ?? "");
  const [status, setStatus] = useState<string>(initialStatus ?? "");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    fetch(`/api/posts?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, platform, query, status]);

  async function copy(content: string) {
    await navigator.clipboard.writeText(content);
  }

  async function remove(postId: string) {
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => item._id !== postId));
    setTotal((current) => Math.max(0, current - 1));
  }

  async function markPosted(postId: string) {
    await fetch(`/api/posts/${postId}/mark-posted`, { method: "POST" });
    setItems((current) =>
      current.map((item) => (item._id === postId ? { ...item, status: "posted" as const } : item))
    );
  }

  return (
    <Card className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Search topic or content" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="">All platforms</option>
          <option value="x">X</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="threads">Threads</option>
          <option value="facebook">Facebook</option>
          <option value="youtube_community">YouTube Community</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="posted">Posted</option>
          <option value="archived">Archived</option>
        </Select>
        <Button type="button" variant="secondary" onClick={() => setPage(1)}>
          Apply filters
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Post</TableHeadCell>
              <TableHeadCell>Platform</TableHeadCell>
              <TableHeadCell>Provider</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Score</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading posts...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No posts found.</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link className="font-medium text-cyan-300 hover:underline" href={`/posts/${item._id}`}>
                        {item.topic}
                      </Link>
                      <p className="line-clamp-2 text-xs text-slate-400">{item.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PlatformBadge platform={item.platform} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{item.provider}</span>
                      <span className="text-xs text-slate-400">{item.model}</span>
                      {item.postFormat === "image" ? <Badge className="w-fit border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">Image</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300">
                      {item.scores?.engagement ?? "—"} / {item.scores?.monetization ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => copy(item.content)}>
                        Copy
                      </Button>
                      <Button type="button" variant="outline" onClick={() => markPosted(item._id)}>
                        Mark posted
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => remove(item._id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Page {page} of {totalPages} · {total} total drafts
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Previous
          </Button>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
