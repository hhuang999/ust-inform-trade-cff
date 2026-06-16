import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        {/* 标题骨架 */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* 认证状态卡骨架 */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 头像卡骨架 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 学生证卡骨架 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-52" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
