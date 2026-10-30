"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/common";
import { useWorkspace } from "@/lib/store/workspace-store";
import { useStudyBro } from "@/lib/store/studybro-store";
import { levelFromXp } from "@/lib/coach/rewards";
import { STUDY_NAV, PROGRESS_NAV, SHOWCASE_NAV, ACCOUNT_NAV, type NavItem } from "./navItems";
import { cn } from "@/lib/utils";

function NavLink({ item, active, onNavigate, badge }: { item: NavItem; active: boolean; onNavigate?: () => void; badge?: React.ReactNode }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-violet-500/12 text-[var(--text)]" : "text-[var(--text-dim)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
      )}
    >
      <Icon size={18} className={cn("shrink-0", active ? "text-[var(--brand-text)]" : "text-[var(--text-faint)] group-hover:text-[var(--text-dim)]")} />
      <span className="flex-1">{item.label}</span>
      {badge}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{children}</p>;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile } = useWorkspace();
  const { phase, progress } = useStudyBro();
  const isActive = (href: string) => pathname === href;
  const lvl = levelFromXp(progress.xp);

  const sessionBadge =
    phase === "running" ? <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-label="Session running" /> :
    phase === "paused" ? <span className="h-2 w-2 rounded-full bg-amber-400" aria-label="Session paused" /> : null;

  return (
    <div className="flex h-full flex-col p-3">
      <Link href="/" onClick={onNavigate} className="px-3 py-3">
        <Logo />
      </Link>

      <nav className="mt-1 flex-1 overflow-y-auto px-0.5" aria-label="Main">
        <div className="space-y-0.5">
          {STUDY_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} badge={item.href === "/focus" ? sessionBadge : undefined} />
          ))}
        </div>
        <SectionLabel>Progress</SectionLabel>
        <div className="space-y-0.5">
          {PROGRESS_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
        <SectionLabel>Showcase</SectionLabel>
        <div className="space-y-0.5">
          {SHOWCASE_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
        <SectionLabel>Account</SectionLabel>
        <div className="space-y-0.5">
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <Link
        href="/profile"
        onClick={onNavigate}
        className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 transition-colors hover:bg-[var(--surface-2)]"
      >
        <Avatar name={profile.name} seed={profile.avatarSeed} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text)]">{profile.name}</p>
          <p className="text-[11px] text-[var(--text-faint)]">Level {lvl.level} · {lvl.name}</p>
        </div>
      </Link>
    </div>
  );
}
