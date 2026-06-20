import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, GraduationCap, MessageSquare, ShieldCheck, ShoppingBag } from "lucide-react";
import type { Notification } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser, type SessionUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatNoticeTime as formatTime, isSameDayCST as isSameDay } from "@/lib/time";
import { notificationHref } from "@/lib/notification-href";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

import { MarkAllReadButton } from "./mark-all-read-button";

export const dynamic = "force-dynamic";

type FilterType = "item" | "service" | "system" | "message" | "all";

/** 把通知 type 前缀映射到筛选分类。 */
function categoryOf(type: string): Exclude<FilterType, "all"> {
  if (type.startsWith("item")) return "item";
  if (
    type.startsWith("service") ||
    type.startsWith("booking") ||
    type.startsWith("need")
  )
    return "service";
  if (type.startsWith("message")) return "message";
  return "system"; // verify_* / system / 兜底
}

const TYPE_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "item", label: "物品" },
  { value: "service", label: "服务" },
  { value: "message", label: "私信" },
  { value: "system", label: "系统" },
];

const CATEGORY_ICON = {
  item: ShoppingBag,
  service: GraduationCap,
  message: MessageSquare,
  system: ShieldCheck,
} as const;

// 时间分组/格式化统一来自 @/lib/time(isSameDayCST / formatNoticeTime),显式 Asia/Shanghai。

function buildHref(type: FilterType): string {
  return type === "all" ? "/notifications" : `/notifications?type=${type}`;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  let me: SessionUser;
  try {
    me = requireVerifiedUser(session?.user ?? null);
  } catch {
    redirect("/login?callbackUrl=/notifications");
  }

  const sp = await searchParams;
  const typeRaw = typeof sp.type === "string" ? sp.type : "all";
  const activeType: FilterType = TYPE_FILTERS.some((t) => t.value === typeRaw)
    ? (typeRaw as FilterType)
    : "all";

  const all = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const notifications = all.filter((n) =>
    activeType === "all" ? true : categoryOf(n.type) === activeType
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 按日期分组:今天 / 更早
  const now = new Date();
  const today: Notification[] = [];
  const earlier: Notification[] = [];
  for (const n of notifications) {
    if (isSameDay(n.createdAt, now)) today.push(n);
    else earlier.push(n);
  }

  const hasAny = notifications.length > 0;

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="通知"
        description="来自物品、服务、私信与系统的消息"
        action={<MarkAllReadButton disabled={!hasAny || unreadCount === 0} />}
      />

      {/* 分类筛选(胶囊链接) */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((t) => {
          const active = t.value === activeType;
          return (
            <Link key={t.value} href={buildHref(t.value)}>
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 text-sm",
                  active && "bg-primary text-primary-foreground"
                )}
              >
                {t.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {!hasAny ? (
        <Empty className="min-h-[320px] border bg-card/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>暂无通知</EmptyTitle>
            <EmptyDescription>
              当有人对你的物品或服务感兴趣时,消息会出现在这里。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-8">
          {today.length > 0 ? (
            <NotificationGroup label="今天" items={today} now={now} />
          ) : null}
          {earlier.length > 0 ? (
            <NotificationGroup label="更早" items={earlier} now={now} />
          ) : null}
        </div>
      )}
    </PageContainer>
  );
}

function NotificationGroup({
  label,
  items,
  now,
}: {
  label: string;
  items: Notification[];
  now: Date;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-card">
        <ul className="divide-y divide-outline-variant/30">
          {items.map((n) => {
            const cat = categoryOf(n.type);
            const Icon = CATEGORY_ICON[cat];
            const titleNode = (
              <span className="font-medium text-foreground">{n.title}</span>
            );
            const showAction = n.type.startsWith("item_confirm");
            const href = notificationHref(n);
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3.5 transition-colors",
                  n.read ? "bg-transparent" : "bg-primary/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                    n.read
                      ? "bg-accent text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {href ? (
                        <Link href={href} className="hover:underline">
                          {titleNode}
                        </Link>
                      ) : (
                        titleNode
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatTime(n.createdAt, now)}
                      </span>
                      {!n.read ? (
                        <span
                          aria-label="未读"
                          className="size-2 rounded-full bg-primary"
                        />
                      ) : null}
                    </div>
                  </div>

                  <p
                    className={cn(
                      "text-sm leading-6",
                      n.read ? "text-muted-foreground" : "text-foreground/80"
                    )}
                  >
                    {n.body}
                  </p>

                  {showAction ? (
                    <Link
                      href="/me/items"
                      className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                    >
                      去处理 →
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
