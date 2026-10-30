"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/"><Logo /></Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--text-dim)] md:flex">
          <a href="/#features" className="transition-colors hover:text-[var(--text)]">Features</a>
          <a href="/#how" className="transition-colors hover:text-[var(--text)]">How it works</a>
          <a href="/#faq" className="transition-colors hover:text-[var(--text)]">FAQ</a>
          <Link href="/help" className="transition-colors hover:text-[var(--text)]">Help</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)] sm:inline-block">
            Log in
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:brightness-110">
            Open App <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
