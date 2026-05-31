import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "outline";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    default: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    ghost: "bg-transparent text-slate-200 hover:bg-slate-800",
    destructive: "bg-rose-500 text-white hover:bg-rose-400",
    outline: "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
