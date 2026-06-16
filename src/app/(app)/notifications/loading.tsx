import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

/** 通知列表加载骨架:标题占位 + 分类胶囊占位 + 行骨架。 */
export default function NotificationsLoading() {
  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="通知"
        description="来自物品、服务与系统的消息"
        action={<Skeleton className="h-8 w-28 rounded-md" />}
      />

      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-full" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-12" />
        <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-card">
          <ul className="divide-y divide-outline-variant/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3.5">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
