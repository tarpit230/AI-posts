import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="space-y-3">
      <h1 className="text-2xl font-semibold">Post not found</h1>
      <p className="text-sm text-slate-400">The draft you requested could not be located.</p>
      <Link href="/posts" className="inline-flex rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100">
        Back to posts
      </Link>
    </Card>
  );
}
