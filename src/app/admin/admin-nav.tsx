"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "身份认证审核", href: "/admin/verify" },
  { label: "举报处理", href: "/admin/reports" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-outline-variant/40 bg-background/60">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-1 px-4 md:px-8">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
