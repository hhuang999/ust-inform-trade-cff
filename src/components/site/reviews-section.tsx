import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** 一条评价在 UI 层的展示形态(由各页面从 Prisma 投影而来)。 */
export interface ReviewDisplayItem {
  id: string;
  rating: number;
  content: string | null;
  reviewerNickname?: string | null;
  /** 卡片右上角副信息,如日期或来源标签。 */
  footer?: string;
}

/** 5 星可视化,填充到 value(四舍五入)。 */
export function StarRating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "size-3.5",
            s <= Math.round(value)
              ? "fill-warning text-warning"
              : "fill-transparent text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

/** 单条已公开评价卡片:星级 + 评价人 + 副信息 + 内容。 */
export function ReviewCard({
  rating,
  content,
  reviewerNickname,
  footer,
}: {
  rating: number;
  content: string | null;
  reviewerNickname?: string | null;
  footer?: string;
}) {
  return (
    <div className="rounded-lg bg-accent/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <StarRating value={rating} />
        <span className="text-xs text-muted-foreground">
          {reviewerNickname ?? "匿名用户"}
          {footer ? ` · ${footer}` : ""}
        </span>
      </div>
      {content ? (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          {content}
        </p>
      ) : null}
    </div>
  );
}

/**
 * 评价展示区:标题旁聚合(星级 + 均分 + 条数),下方为评价卡片列表。
 * 无评价时返回 null(调用方按需渲染,避免空态噪音)。
 */
export function ReviewsSection({
  reviews,
  avg,
  count,
  title = "交易评价",
}: {
  reviews: ReviewDisplayItem[];
  avg: number | null;
  count: number;
  title?: string;
}) {
  if (reviews.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
          <Star className="size-4 text-primary" />
          {title}
          {count > 0 && avg != null ? (
            <span className="inline-flex items-center gap-1.5 font-normal text-muted-foreground">
              <StarRating value={avg} />
              <span className="font-serif font-semibold tabular-nums text-foreground">
                {avg.toFixed(1)}
              </span>
              <span>· {count} 条</span>
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reviews.map((r) => (
          <ReviewCard
            key={r.id}
            rating={r.rating}
            content={r.content}
            reviewerNickname={r.reviewerNickname}
            footer={r.footer}
          />
        ))}
      </CardContent>
    </Card>
  );
}
