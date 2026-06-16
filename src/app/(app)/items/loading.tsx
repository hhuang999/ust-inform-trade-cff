import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsLoading() {
  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="二手物品"
        description="校内闲置好物,安心流转"
        action={<Skeleton className="h-9 w-24 rounded-md" />}
      />

      {/* 分类筛选骨架 */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      {/* 搜索 + 排序骨架 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* 物品网格骨架 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-card"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
