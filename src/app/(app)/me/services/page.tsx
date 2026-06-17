import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  Pencil,
  Plus,
  Wrench,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
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

export const dynamic = "force-dynamic";

type ServiceStatus = "ACTIVE" | "PAUSED" | "CLOSED";

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

/** 把 imageKey 解析为 R2 公开 URL;缺失时返回 null。 */
function publicUrl(imageKey?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!imageKey || !base) return null;
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

export default async function MyServicesPage() {
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

  // 我发布的:全部状态(ACTIVE/PAUSED/CLOSED),确保暂停/关闭后仍可在此找回与管理。
  const services = await prisma.service.findMany({
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
  });

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="我发布的服务"
        description="管理你上架、暂停或已关闭的服务"
        action={
          <Button asChild>
            <Link href="/services/new">
              <Plus />
              发布服务
            </Link>
          </Button>
        }
      />

      {services.length === 0 ? (
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
      )}
    </PageContainer>
  );
}
