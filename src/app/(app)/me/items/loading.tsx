import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyItemsLoading() {
  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="我的交易"
        description="管理你发布的物品、关注的意向与进行中的交易"
      />

      {/* Tab 骨架 */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>

      {/* 行卡片骨架(适配三个 tab 的卡片形态) */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-outline-variant/40 bg-card p-3 shadow-card"
          >
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
