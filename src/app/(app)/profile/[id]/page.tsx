import { notFound } from "next/navigation";
import { ShieldAlert, Star, Package, Wrench, Search } from "lucide-react";

import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, type VerificationStatus } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const ANIM = "animate-in fade-in slide-in-from-bottom-4 duration-500";

/** Mask the student id, showing only the trailing segment. */
function maskStudentId(sid: string): string {
  if (sid.length <= 4) return sid;
  return "•".repeat(sid.length - 4) + sid.slice(-4);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      nickname: true,
      avatarKey: true,
      department: true,
      enrollmentYear: true,
      realName: true,
      realNameVisible: true,
      studentId: true,
      verificationStatus: true,
      violationCount: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const avatarUrl = user.avatarKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`
    : null;
  const initial = (user.nickname ?? "?").charAt(0).toUpperCase();

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        {/* Header card */}
        <Card className={ANIM}>
          <CardContent className="p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="size-20 ring-2 ring-primary/30">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user.nickname ?? "头像"} />
                ) : null}
                <AvatarFallback className="bg-primary-container font-serif text-2xl font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold tracking-tight">
                    {user.nickname}
                  </h1>
                  <Badge
                    status={
                      user.verificationStatus as VerificationStatus
                    }
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {user.department} · {user.enrollmentYear} 级
                </p>

                {user.realNameVisible && user.realName ? (
                  <p className="text-sm text-muted-foreground">
                    真实姓名：
                    <span className="text-foreground">{user.realName}</span>
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Badge
                    variant={user.violationCount > 0 ? "destructive" : "secondary"}
                    className={cn(
                      "font-normal",
                      user.violationCount === 0
                        ? "text-muted-foreground"
                        : null,
                    )}
                  >
                    <ShieldAlert className="size-3.5" />
                    违规 {user.violationCount}
                  </Badge>
                </div>
              </div>
            </header>
          </CardContent>
        </Card>

        {/* Stats row */}
        <Card className={ANIM}>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-outline-variant/40">
              <StatCell label="信誉" value="待评价" />
              <StatCell label="发布数" value={0} numeric />
              <StatCell label="违规" value={user.violationCount} numeric />
            </div>
          </CardContent>
        </Card>

        {/* Two-column area */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 信誉与评价 */}
          <Card className={ANIM}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4 text-primary" />
                信誉与评价
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <Empty className="border-transparent p-0">
                <EmptyTitle className="text-sm">暂无评价</EmptyTitle>
                <EmptyDescription>
                  完成交易后，双方可互相评价。
                </EmptyDescription>
              </Empty>
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card className={ANIM}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 py-2">
              <InfoRow label="院系" value={user.department} />
              <Separator />
              <InfoRow label="入学年份" value={`${user.enrollmentYear} 级`} />
              <Separator />
              <InfoRow
                label="学号"
                value={maskStudentId(user.studentId)}
              />
              <Separator />
              <InfoRow
                label="加入时间"
                value={formatDate(user.createdAt)}
              />
            </CardContent>
          </Card>
        </div>

        {/* History tabs */}
        <Card className={ANIM}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">发布历史</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items" className="gap-1.5">
                  <Package className="size-3.5" />
                  物品
                </TabsTrigger>
                <TabsTrigger value="services" className="gap-1.5">
                  <Wrench className="size-3.5" />
                  服务
                </TabsTrigger>
                <TabsTrigger value="needs" className="gap-1.5">
                  <Search className="size-3.5" />
                  需求
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-3">
                <HistoryEmpty
                  icon={<Package className="size-6" />}
                  hint="暂无发布的物品"
                />
              </TabsContent>
              <TabsContent value="services" className="mt-3">
                <HistoryEmpty
                  icon={<Wrench className="size-6" />}
                  hint="暂无发布的服务"
                />
              </TabsContent>
              <TabsContent value="needs" className="mt-3">
                <HistoryEmpty
                  icon={<Search className="size-6" />}
                  hint="暂无发布的求购"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

/** A single stat cell inside the divided stats row. */
function StatCell({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string | number;
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-4">
      <span
        className={cn(
          "text-foreground",
          numeric
            ? "font-serif text-xl font-bold tabular-nums"
            : "font-serif text-lg font-semibold",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/** A labeled info row used in 基本信息. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  );
}

/** Empty state used inside each history tab. */
function HistoryEmpty({
  icon,
  hint,
}: {
  icon: React.ReactNode;
  hint: string;
}) {
  return (
    <Empty className="border-dashed py-8">
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle className="text-sm">{hint}</EmptyTitle>
      <EmptyDescription>相关数据将在后续阶段接入。</EmptyDescription>
    </Empty>
  );
}

function formatDate(d: Date): string {
  // Locale-independent, deterministic formatting for SSR stability.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
