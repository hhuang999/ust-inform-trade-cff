import type { HTMLAttributes } from "react";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export const VERIFICATION_STATUS: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: "已认证",
    className: "bg-verified-soft text-verified ring-verified/20",
  },
  PENDING: {
    label: "审核中",
    className: "bg-pending-soft text-pending ring-pending/20",
  },
  REJECTED: {
    label: "认证未通过",
    className: "bg-rejected-soft text-rejected ring-rejected/20",
  },
  UNVERIFIED: {
    label: "未认证",
    className: "bg-unverified-soft text-unverified ring-unverified/20",
  },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral";
}

/** A small status pill. When `status` is provided, renders the semantic verification label. */
export function Badge({
  status,
  className = "",
  children,
  ...props
}: BadgeProps & { status?: VerificationStatus }) {
  if (status) {
    const meta = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.UNVERIFIED;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className} ${className}`}
        {...props}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {meta.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
