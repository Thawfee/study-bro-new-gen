import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-white shadow-sm shadow-violet-900/30 hover:brightness-110",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]",
  ghost: "text-[var(--text-dim)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
  danger: "border border-rose-400/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15",
  success: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", icon: Icon, className, children } = props;
  const cls = cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const inner = (
    <>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </>
  );
  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {inner}
      </Link>
    );
  }
  const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, href: _h, ...rest } =
    props as ButtonProps;
  void _v; void _s; void _i; void _c; void _ch; void _h;
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}
