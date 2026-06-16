import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Profile loading skeleton — mirrors the paper-feel profile layout.
 * Avatar circle + name/badge/meta lines, stat row, two-column cards,
 * and the history tabs skeleton.
 */
export default function ProfileLoading() {
  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        {/* Header card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-outline-variant/40">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 py-4">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two-column cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card
              key={i}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3 py-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* History tabs */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3 py-2">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
