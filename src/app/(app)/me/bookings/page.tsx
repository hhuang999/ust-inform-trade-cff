import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

type Tab = "incoming" | "outgoing";

const TABS: { value: Tab; label: string }[] = [
  { value: "incoming", label: "我接的预约" },
  { value: "outgoing", label: "我的预约" },
];

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

/** 预约状态徽章(仅用于列表行内非动作区域的次要展示)。 */
function BookingStatusBadge({ status }: { status: BookingStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-warning/90 text-white">
          待确认
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="secondary" className="font-normal">
          已确认
        </Badge>
      );
    case "CANCELLING":
      return (
        <Badge variant="secondary" className="bg-warning/90 text-white">
          取消协商中
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="success" className="font-normal">
          已完成
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          已拒绝
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          已取消
        </Badge>
      );
  }
}

/** 把 ISO 时间格式化为本地可读的日期时间(YYYY-MM-DD HH:mm)。 */
function formatSlot(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/** 同一日内仅展示时间,跨日展示完整日期。 */
function formatSlotRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return formatSlot(startIso);
  }
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const datePart = formatSlot(startIso).slice(0, 10);
  if (sameDay) {
    const hh = String(end.getHours()).padStart(2, "0");
    const mm = String(end.getMinutes()).padStart(2, "0");
    return `${datePart} ${String(start.getHours()).padStart(2, "0")}:${String(
      start.getMinutes()
    ).padStart(2, "0")} ~ ${hh}:${mm}`;
  }
  return `${formatSlot(startIso)} ~ ${formatSlot(endIso)}`;
}

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  let viewerId: string;
  try {
    viewerId = requireVerifiedUser(
      session?.user
        ? {
            id: session.user.id,
            role: session.user.role,
            verificationStatus: session.user.verificationStatus,
          }
        : null
    ).id;
  } catch {
    redirect("/login");
  }

  const sp = await searchParams;
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "incoming";
  const tab: Tab = TABS.some((t) => t.value === tabRaw)
    ? (tabRaw as Tab)
    : "incoming";

  // 拉取我作为客户或提供者参与的预约(进行中 + 终态)。
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ clientId: viewerId }, { service: { providerId: viewerId } }],
      status: {
        in: ["PENDING", "CONFIRMED", "CANCELLING", "COMPLETED", "REJECTED", "CANCELLED"],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          providerId: true,
          provider: { select: { id: true, nickname: true } },
        },
      },
      client: { select: { id: true, nickname: true } },
    },
  });

  // 过滤当前 tab:incoming = 我是提供者;outgoing = 我是客户。
  const list = bookings.filter((b) =>
    tab === "incoming"
      ? b.service.providerId === viewerId
      : b.clientId === viewerId
  );

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="服务预约"
        description="管理你接到的与发出的服务预约"
      />

      {/* ── Tab 切换(server Link tabs) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link key={t.value} href={`/me/bookings?tab=${t.value}`}>
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

      {list.length === 0 ? (
        <Empty className="min-h-[320px] border bg-card/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarPlus />
            </EmptyMedia>
            <EmptyTitle>
              {tab === "incoming" ? "还没有人预约你的服务" : "你还没有预约过服务"}
            </EmptyTitle>
            <EmptyDescription>
              {tab === "incoming"
                ? "保持服务上架,有新预约时会出现在这里"
                : "去服务市场看看,预约一位服务提供者"}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href="/services">去逛逛服务</Link>
          </Button>
        </Empty>
      ) : (
        <div className="space-y-3">
          {list.map((b) => {
            const isProvider = b.service.providerId === viewerId;
            const role: "provider" | "client" = isProvider ? "provider" : "client";
            const counterparty = isProvider
              ? b.client.nickname
              : b.service.provider.nickname;
            const status = b.status as BookingStatus;
            const isViewerFirstConfirmer =
              !!b.firstConfirmerId && b.firstConfirmerId === viewerId;
            const isCanceller =
              status === "CANCELLING" && !!b.cancelledById && b.cancelledById === viewerId;

            return (
              <Card key={b.id}>
                <CardContent className="space-y-3 p-4">
                  {/* 服务标题 + 对方 + 角色 */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/services/${b.service.id}`}
                          className="font-serif text-base font-semibold transition-colors hover:text-primary"
                        >
                          {b.service.title}
                        </Link>
                        <BookingStatusBadge status={status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isProvider ? "你是服务方" : "你是客户"} ·{" "}
                        <span className="text-foreground/80">{counterparty}</span>
                      </p>
                    </div>
                    <Badge
                      variant={isProvider ? "default" : "secondary"}
                      className="font-normal"
                    >
                      {isProvider ? "服务方" : "客户"}
                    </Badge>
                  </div>

                  {/* 时段 + 备注 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      {formatSlotRange(
                        b.slotStart.toISOString(),
                        b.slotEnd.toISOString()
                      )}
                    </span>
                  </div>
                  {b.note ? (
                    <p className="rounded-md bg-accent/60 px-3 py-2 text-sm text-foreground/80">
                      {b.note}
                    </p>
                  ) : null}

                  {/* 动作区 */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-3">
                    <BookingActions
                      bookingId={b.id}
                      role={role}
                      status={status}
                      isViewerFirstConfirmer={isViewerFirstConfirmer}
                      isCanceller={isCanceller}
                      hasFirstConfirmer={!!b.firstConfirmerId}
                      rejectReason={b.rejectReason}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
