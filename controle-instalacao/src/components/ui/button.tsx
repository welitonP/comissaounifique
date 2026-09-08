import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-medium " +
  "whitespace-nowrap select-none transition-all outline-none " +
  "focus-visible:border-[var(--color-ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/50 " +
  "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  default:
    "border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]",
  primary:
    "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
  ghost: "border-transparent bg-transparent hover:bg-[var(--color-muted)]",
  danger:
    "border-transparent bg-[var(--color-destructive)] text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
  icon: "h-8 w-8 p-0",
};

export function buttonClass(variant: Variant = "default", size: Size = "sm"): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "default", size = "sm", className = "", ...props }: Props) {
  return <button {...props} className={`${buttonClass(variant, size)} ${className}`} />;
}
