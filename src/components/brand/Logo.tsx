import { Brain, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  withText = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "lg" ? 24 : size === "sm" ? 16 : 20;
  const text = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("relative grid shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-gradient-to-br from-[#10172b] via-violet-600 to-indigo-700 shadow-lg shadow-violet-500/20", box)}>
        <Shield size={icon + 3} className="text-white/18" strokeWidth={1.8} />
        <Brain size={icon} className="absolute text-white" />
        <Sparkles size={icon * 0.46} className="absolute -right-1 -top-1 text-[var(--accent)]" strokeWidth={2.5} />
      </span>
      {withText && (
        <span className={cn("font-bold tracking-tight text-[var(--text)]", text)}>
          Study<span className="gradient-text">Bro</span>
          <span className="ml-1 text-[0.6em] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">
            AI
          </span>
        </span>
      )}
    </div>
  );
}
