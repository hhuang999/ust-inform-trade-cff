import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg shadow-sm hover:bg-brand-strong",
  ghost:
    "text-foreground/80 hover:bg-muted hover:text-foreground",
  outline:
    "border border-border bg-card text-foreground hover:bg-muted",
  danger:
    "bg-rejected text-white shadow-sm hover:brightness-110",
  success:
    "bg-verified text-white shadow-sm hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
