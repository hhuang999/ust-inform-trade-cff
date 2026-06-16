import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "destructive";

/**
 * Semantic verification metadata.
 *
 * Shape is preserved from the original implementation (`label` + `className`).
 * An optional `variant` key is added so consumers can also resolve a cva
 * variant directly if they want to render a plain pill themselves.
 */
export const VERIFICATION_STATUS: Record<
  VerificationStatus,
  { label: string; className: string; variant?: BadgeVariant }
> = {
  VERIFIED: {
    label: "已认证",
    className: "bg-verified-soft text-verified ring-verified/20",
    variant: "success",
  },
  PENDING: {
    label: "审核中",
    className: "bg-pending-soft text-pending ring-pending/20",
    variant: "secondary",
  },
  REJECTED: {
    label: "认证未通过",
    className: "bg-rejected-soft text-rejected ring-rejected/20",
    variant: "destructive",
  },
  UNVERIFIED: {
    label: "未认证",
    className: "bg-unverified-soft text-unverified ring-unverified/20",
    variant: "outline",
  },
};

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 outline-none overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        outline:
          "border-outline-variant/40 text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-success text-white [a&]:hover:bg-success/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "className">,
    VariantProps<typeof badgeVariants> {
  className?: string;
  /** When provided, renders the semantic verification label + dot. */
  status?: VerificationStatus;
  asChild?: boolean;
}

/**
 * A small status pill.
 *
 * When `status` is provided, renders the matching semantic verification label
 * (with a leading dot) via VERIFICATION_STATUS, falling back to UNVERIFIED.
 * Otherwise renders the children with the chosen cva `variant`.
 */
export function Badge({
  status,
  variant,
  className,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  // Semantic verification status path — unchanged rendering, preserves the
  // original `className` tokens and the leading status dot.
  if (status) {
    const meta = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.UNVERIFIED;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          meta.className,
          className
        )}
        {...props}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {meta.label}
      </span>
    );
  }

  // Plain pill path — cva variant + className.
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { badgeVariants };
