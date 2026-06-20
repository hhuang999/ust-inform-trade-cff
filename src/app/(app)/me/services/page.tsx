import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  Pencil,
  Plus,
  Wrench,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatSlotRangeCST as formatSlotRange } from "@/lib/time";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookingActions } from "@/app/(app)/me/bookings/booking-actions";

export const dynamic = "force-dynamic";

type Tab = "published" | "incoming" | "outgoing";

const TABS: { value: Tab; label: string }[] = [
  { value: "published", label: "我发布的服务" },
  { value: "incoming", label: "我接的预约" },
  { value: "outgoing", label: "我的预约" },
];

type ServiceStatus = "ACTIVE" | "PAUSED" | "CLOSED";
type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

/** 服务状态徽标(我发布的服务)。 */
function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="font-normal">
          上架中
        </Badge>
      );
    case "PAUSED":
      return (
        <Badge variant="secondary" className="bg-warning/90 text-white">
          已暂停
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          已关闭
        </Badge>
      );
  }
}

/** 预约状态徽章(列表行内次要展示)。 */
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

/** 把 imageKey 解析为 R2 公开 URL;缺失时返回 null。 */
function publicUrl(imageKey?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!imageKey || !base) return null;
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

// 时段格式化统一走 @/lib/time(显式 Asia/Shanghai),避免服务端 UTC 渲染偏差。

export default async function MyServicesPage({
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
    redirect("/login?callbackUrl=/me/services");
  }

  const sp = await searchParams;
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "published";
  const tab: Tab = TABS.some((t) => t.value === tabRaw)
    ? (tabRaw as Tab)
    : "published";

  // 三个数据源并行:「我发布的服务」+ 我参与的全部预约 + 我已评价的预约。
  const [services, bookings, bookingsReviewed] = await Promise.all([
    prisma.service.findMany({
      where: { providerId: viewerId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            // 待确认预约数(提供者最关心的待办)。
            bookings: { where: { status: "PENDING" } },
          },
        },
      },
    }),
    prisma.booking.findMany({
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
    }),
    prisma.review.findMany({
      where: { reviewerId: viewerId, dealType: "BOOKING" },
      select: { dealId: true },
    }),
  ]);
  const reviewedBookingIds = new Set(bookingsReviewed.map((r) => r.dealId));

  // 当前 tab 的预约列表:incoming = 我是提供者;outgoing = 我是客户。
  const bookingList = bookings.filter((b) =>
    tab === "incoming"
      ? b.service.providerId === viewerId
      : b.clientId === viewerId
  );

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="服务预约"
        description="管理你发布的服务与全部服务预约"
        action={
          <Button asChild>
            <Link href="/services/new">
              <Plus />
              发布服务
            </Link>
          </Button>
        }
      />

      {/* ── Tab 切换(server Link tabs) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link key={t.value} href={`/me/services?tab=${t.value}`}>
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

      {/* ── 我发布的服务 ── */}
      {tab === "published" ? (
        services.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wrench />
              </EmptyMedia>
              <EmptyTitle>还没有发布服务</EmptyTitle>
              <EmptyDescription>用你的能力帮助同学,发布第一项服务吧</EmptyDescription>
            </EmptyHeader>
            <Button asChild>
              <Link href="/services/new">发布服务</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const status = service.status as ServiceStatus;
              const editable = status === "ACTIVE" || status === "PAUSED";
              return (
                <Card key={service.id} className="overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-3">
                    <Link
                      href={`/services/${service.id}`}
                      className="group flex min-w-0 flex-1 items-center gap-4"
                    >
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent text-muted-foreground">
                        {publicUrl(service.proofImageKeys[0]) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={publicUrl(service.proofImageKeys[0]) ?? undefined}
                            alt={service.title}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Wrench className="size-5 opacity-60" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="line-clamp-1 font-serif text-base font-semibold">
                            {service.title}
                          </h3>
                          <ServiceStatusBadge status={status} />
                        </div>
                        <p className="mt-0.5 font-serif text-sm tabular-nums text-primary">
                          {service.price}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {service.categories.slice(0, 3).map((c) => (
                            <span key={c}>{c}</span>
                          ))}
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="size-3.5" />
                            待确认 {service._count.bookings}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* 动作区 */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {editable ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/services/${service.id}/edit`}>
                            <Pencil />
                            编辑
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className={cn(status === "CLOSED" && "text-muted-foreground")}
                      >
                        <Link href={`/services/${service.id}`}>
                          管理
                          <ChevronRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {/* ── 我接的预约 / 我的预约 ── */}
      {tab !== "published" ? (
        bookingList.length === 0 ? (
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
            {bookingList.map((b) => {
              const isProvider = b.service.providerId === viewerId;
              const role: "provider" | "client" = isProvider ? "provider" : "client";
              const counterparty = isProvider
                ? b.client.nickname
                : b.service.provider.nickname;
              const status = b.status as BookingStatus;
              const isViewerFirstConfirmer =
                !!b.firstConfirmerId && b.firstConfirmerId === viewerId;
              const isCanceller =
                status === "CANCELLING" &&
                !!b.cancelledById &&
                b.cancelledById === viewerId;

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
                        counterpartyNickname={counterparty}
                        hasReviewed={reviewedBookingIds.has(b.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : null}
    </PageContainer>
  );
}
