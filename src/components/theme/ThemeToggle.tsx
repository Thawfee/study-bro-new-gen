"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePref } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5", className)}>
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            aria-label={`${o.label} theme`}
            aria-pressed={active}
            title={o.label}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full transition-colors",
              active ? "bg-[var(--brand)] text-white" : "text-[var(--text-dim)] hover:text-[var(--text)]",
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
