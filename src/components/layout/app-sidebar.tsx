"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Compass,
  Heart,
  Lock,
  Package,
  Settings,
  ShieldCheck,
  User,
  Wrench,
  HandHeart,
  Home as HomeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SessionUser } from "@/components/layout/user-menu";

type IconType = React.ComponentType<{ className?: string }>;

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  /** 未登录占位:条目可见但点击会跳登录页(右侧显示小锁暗示)。 */
  locked?: boolean;
};

function browseItems(): NavItem[] {
  return [
    { label: "首页", href: "/", icon: HomeIcon },
    { label: "物品", href: "/items", icon: Package },
    { label: "服务", href: "/services", icon: Wrench },
    { label: "需求", href: "/needs", icon: HandHeart },
    { label: "用户指南", href: "/guide", icon: Compass },
  ];
}

/**
 * 「我的」条目定义。登录后用真实路径;未登录时同样展示这些条目,
 * 但点击会跳到登录页(并带回调地址),让访客直观看到「注册登录后能做什么」。
 */
type MineDef = {
  label: string;
  /** 登录后的真实路径;{userId} 占位在「我的主页」上由当前用户 id 替换。 */
  path: string;
  icon: IconType;
};

// 「我的」:三类交易各一个入口(物品交易/服务预约/需求撮合),内含 tab 整合相关子功能;
// 服务预约/需求撮合不再单列,/me/bookings、/me/matches 已重定向进对应 tab。
const MINE_DEFS: MineDef[] = [
  { label: "我的主页", path: "/profile/{userId}", icon: User },
  { label: "物品交易", path: "/me/items", icon: Package },
  { label: "服务预约", path: "/me/services", icon: Wrench },
  { label: "需求撮合", path: "/me/needs", icon: HandHeart },
  { label: "我的收藏", path: "/me/favorites", icon: Heart },
  { label: "通知", path: "/notifications", icon: Bell },
  { label: "设置", path: "/settings", icon: Settings },
];

/** 已登录:渲染真实路径。 */
function mineItems(userId: string): NavItem[] {
  return MINE_DEFS.map((d) => ({
    label: d.label,
    href: d.path.replace("{userId}", userId),
    icon: d.icon,
  }));
}

/** 未登录:条目依旧可见,但统一导向登录页;固定路径带回调,「我的主页」无 id 故直登。 */
function mineGuestItems(): NavItem[] {
  return MINE_DEFS.map((d) => ({
    label: d.label,
    icon: d.icon,
    locked: true,
    href:
      d.path === "/profile/{userId}"
        ? "/login"
        : `/login?callbackUrl=${encodeURIComponent(d.path)}`,
  }));
}

function adminItems(): NavItem[] {
  return [{ label: "认证审核", href: "/admin/verify", icon: ShieldCheck }];
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.locked ? (
              <Lock className="ml-auto size-3 shrink-0 text-muted-foreground/60" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function AppSidebar({
  user,
  className,
}: {
  user?: SessionUser | null;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-outline-variant/40 bg-card/50",
        className
      )}
    >
      <nav className="sticky top-16 flex max-h-[calc(100vh-4rem)] flex-col gap-5 overflow-y-auto p-3">
        <NavGroup title="浏览" items={browseItems()} pathname={pathname} />
        {/* 未登录也展示「我的」,让访客看见注册登录后能用的功能(点击跳登录页)。 */}
        <NavGroup
          title="我的"
          items={user ? mineItems(user.id) : mineGuestItems()}
          pathname={pathname}
        />
        {user?.role === "ADMIN" ? (
          <NavGroup title="管理" items={adminItems()} pathname={pathname} />
        ) : null}
      </nav>
    </aside>
  );
}
