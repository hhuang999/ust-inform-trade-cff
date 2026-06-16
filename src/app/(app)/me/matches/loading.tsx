import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyMatchesLoading() {
  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="需求匹配"
        description="管理你的应征与你发布需求的撮合"
      />

      {/* Tab 骨架 */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>

      {/* 行卡片骨架 */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-outline-variant/40 bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-8 w-32 self-end rounded-md" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
