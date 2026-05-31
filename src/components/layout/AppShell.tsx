import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "../ui/card";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/settings", label: "Settings" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <Card className="sticky top-6 flex flex-col gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Posts</p>
            <h1 className="mt-2 text-xl font-semibold">Post Generator</h1>
            <p className="mt-2 text-sm text-slate-400">Generate, refine, and track drafts in one place.</p>
          </div>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Card>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
