"use client";

import { useEffect, useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SearchModal } from "@/components/navigation/SearchModal";
import { SessionPill } from "@/components/session/SessionPill";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const isExpo = pathname === "/expo";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (isExpo) return <div className="min-h-screen">{children}</div>;

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-[var(--bg-elev)] focus:px-3 focus:py-2">Skip to content</a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-[var(--border)] bg-[var(--bg-elev)]/80 backdrop-blur-xl lg:block">
        <Sidebar />
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden transition-opacity", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-[var(--border)] bg-[var(--bg-elev)] transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface)]">
            <X size={18} />
          </button>
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface)] lg:hidden">
                <Menu size={20} />
              </button>
              <div className="lg:hidden"><Logo withText={false} size="sm" /></div>
              <button onClick={() => setSearch(true)} className="hidden h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-faint)] transition-colors hover:text-[var(--text-dim)] sm:flex">
                <Search size={15} />
                <span>Search pages, notes, tasks…</span>
                <kbd className="ml-4 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSearch(true)} aria-label="Search" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface)] sm:hidden">
                <Search size={18} />
              </button>
              <SessionPill />
              <ThemeToggle className="hidden sm:inline-flex" />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[84rem] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-10">{children}</main>
      </div>

      <BottomNav />
      <SearchModal open={search} onClose={() => setSearch(false)} />
    </div>
  );
}
