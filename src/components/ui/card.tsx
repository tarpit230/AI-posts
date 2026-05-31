import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-glow backdrop-blur", className)}
      {...props}
    />
  );
}
