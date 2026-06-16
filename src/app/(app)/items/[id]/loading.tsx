import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 物品详情页骨架:图片块 + 标题/价格 + 卖家卡 + 文案行。
 */
export default function ItemDetailLoading() {
  return (
    <PageContainer className="space-y-6">
      {/* 面包屑骨架 */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* 左主区 */}
        <div className="space-y-6">
          {/* 图片块 */}
          <Card className="overflow-hidden p-0">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
          </Card>

          {/* 标题 + 价格 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* 卖家卡 */}
          <Card>
            <CardContent className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </CardContent>
          </Card>

          {/* 描述行 */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>

        {/* 右侧栏 */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
