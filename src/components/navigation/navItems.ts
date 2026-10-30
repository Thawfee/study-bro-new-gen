import {
  LayoutDashboard,
  Timer,
  Layers,
  CheckSquare,
  Target,
  NotebookPen,
  BarChart3,
  Trophy,
  Settings,
  CircleHelp,
  Presentation,
  Beaker,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short description used by global search. */
  hint?: string;
}

export const STUDY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, hint: "Today at a glance" },
  { href: "/focus", label: "Focus Session", icon: Timer, hint: "Start a monitored study session" },
  { href: "/review", label: "Review", icon: Layers, hint: "Flashcards with spaced repetition" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, hint: "To-dos and doubts" },
  { href: "/goals", label: "Goals", icon: Target, hint: "Daily, weekly and monthly targets" },
  { href: "/notes", label: "Notes", icon: NotebookPen, hint: "Notes and Q/A cards" },
];

export const PROGRESS_NAV: NavItem[] = [
  { href: "/analytics", label: "Insights", icon: BarChart3, hint: "History, patterns and coach insights" },
  { href: "/achievements", label: "Achievements", icon: Trophy, hint: "Badges, XP and levels" },
];

export const SHOWCASE_NAV: NavItem[] = [
  { href: "/expo", label: "Expo Mode", icon: Presentation, hint: "Full-screen demo for judges" },
  { href: "/lab", label: "AI Test Lab", icon: Beaker, hint: "Measure detection accuracy" },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, hint: "Alerts, sounds, AI and data" },
  { href: "/help", label: "Help", icon: CircleHelp, hint: "How StudyBro works" },
];

/** Flat list used by global search. */
export const ALL_NAV: NavItem[] = [...STUDY_NAV, ...PROGRESS_NAV, ...SHOWCASE_NAV, ...ACCOUNT_NAV];

/** Bottom nav (mobile) — the essentials. */
export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/review", label: "Review", icon: Layers },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
];
