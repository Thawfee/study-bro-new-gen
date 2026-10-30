import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title + optional subtitle + right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[var(--text-dim)]">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]">
        <Icon size={24} />
      </span>
      <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="max-w-sm text-sm text-[var(--text-dim)]">{message}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number; // 0..1
  tone?: "brand" | "good" | "warn" | "bad";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const bg = {
    brand: "bg-gradient-to-r from-violet-500 to-indigo-500",
    good: "bg-emerald-400",
    warn: "bg-amber-400",
    bad: "bg-rose-400",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export function Avatar({ name, seed, size = 40 }: { name: string; seed?: string; size?: number }) {
  const key = (seed || name || "s").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const grad = AVATAR_GRADIENTS[key % AVATAR_GRADIENTS.length];
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "S";
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white", grad)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
