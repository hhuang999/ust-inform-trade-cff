import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ReviewCardSkeleton() {
  return (
    <Card className="gap-5">
      <CardContent className="space-y-5">
        {/* Applicant header: avatar + lines */}
        <div className="flex items-start gap-4">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="hidden h-3 w-20 sm:block" />
        </div>

        {/* Image blocks */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="hidden aspect-[4/3] w-full rounded-lg sm:block" />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/40 pt-4">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminVerifyLoading() {
  return (
    <PageContainer className="max-w-4xl space-y-8">
      <SectionHeading
        title="身份认证审核"
        description="核对学生提交的学生证照片,通过或拒绝认证申请。"
        action={<Skeleton className="h-6 w-24 rounded-full" />}
      />
      <div className="space-y-5">
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    </PageContainer>
  );
}
