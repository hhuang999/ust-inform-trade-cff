import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserMenu, type SessionUser } from "@/components/layout/user-menu";

const NAV_LINKS = [
  { label: "首页", href: "/" },
  { label: "物品", href: "/items" },
  { label: "服务", href: "/services" },
  { label: "需求", href: "/needs" },
  { label: "用户指南", href: "/guide" },
];

export function SiteHeader({ user }: { user?: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <MobileSidebar user={user} />
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" />
            </span>
            <span className="font-serif text-lg font-bold tracking-tight">
              校园枢纽 UniSwap
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <NotificationBell />
              <div className="mx-1 hidden h-5 w-px bg-outline-variant/40 sm:block" />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild>
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
