import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export default function NeedsLoading() {
  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="需求广场"
        description="发布你的需求,匹配合适的提供者"
        action={<Skeleton className="h-9 w-24 rounded-md" />}
      />

      {/* 广场切换骨架 */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* 分类筛选骨架 */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      {/* 搜索 + 筛选骨架 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-72 rounded-lg" />
      </div>

      {/* 需求网格骨架 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline-variant/40 bg-card shadow-card"
          >
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
