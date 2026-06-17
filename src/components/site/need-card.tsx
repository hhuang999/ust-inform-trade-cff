import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type NeedCardStatus = "OPEN" | "PAUSED" | "CLOSED";
export type ExpectedTimeValue =
  | "ASAP"
  | "THIS_WEEK"
  | "TWO_WEEKS"
  | "FLEXIBLE";

export interface NeedCardProps {
  id: string;
  title: string;
  category: string;
  expectedTime: ExpectedTimeValue;
  formatPreference: string;
  reward: string;
  requesterNickname: string;
  requesterRating?: number | null;
  applicantCount?: number;
  status: NeedCardStatus;
  createdAt?: Date | string;
}

/** 期望时间 → 紧迫度徽章。ASAP→急(success 绿),THIS_WEEK→warning,其余→muted。 */
function urgencyMeta(
  t: ExpectedTimeValue
): { label: string; variant: BadgeVariant; className?: string } {
  switch (t) {
    case "ASAP":
      return { label: "急", variant: "success" };
    case "THIS_WEEK":
      return { label: "本周内", variant: "secondary" };
    case "TWO_WEEKS":
      return { label: "两周内", variant: "outline" };
    case "FLEXIBLE":
      return { label: "灵活", variant: "outline" };
    default:
      return { label: "灵活", variant: "outline" };
  }
}

/** 期望时间 → 简短文案(元信息行使用)。 */
function expectedTimeLabel(t: ExpectedTimeValue): string {
  switch (t) {
    case "ASAP":
      return "尽快";
    case "THIS_WEEK":
      return "本周内";
    case "TWO_WEEKS":
      return "两周内";
    case "FLEXIBLE":
      return "时间灵活";
    default:
      return "时间灵活";
  }
}

/**
 * 需求卡片(展示型,可用于列表页与首页)。无 hooks,可在服务端组件中使用。
 */
export function NeedCard({
  id,
  title,
  category,
  expectedTime,
  formatPreference,
  reward,
  requesterNickname,
  requesterRating,
  applicantCount = 0,
  status,
}: NeedCardProps) {
  const inactive = status === "PAUSED" || status === "CLOSED";
  const urgency = urgencyMeta(expectedTime);

  return (
    <Link href={`/needs/${id}`} className="group block">
      <Card
        className={cn(
          "h-full rounded-xl border border-outline-variant/40 bg-card p-0 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-float",
          inactive && "opacity-70"
        )}
      >
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-serif text-base font-semibold text-foreground">
              {title}
            </h3>
            <Badge variant={urgency.variant} className="shrink-0 font-normal">
              {urgency.label}
            </Badge>
          </div>

          {/* 元信息:期望时间 · 形式偏好 · 分类 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{expectedTimeLabel(expectedTime)}</span>
            <span aria-hidden>·</span>
            <span>{formatPreference}</span>
            <span aria-hidden>·</span>
            <Badge variant="outline" className="font-normal">
              {category}
            </Badge>
          </div>

          {/* 回报 */}
          <p className="line-clamp-1 font-serif text-lg tabular-nums text-primary">
            {reward}
          </p>

          {/* 发布者 + 应征人数 */}
          <div className="flex items-center justify-between gap-1.5 pt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">
                  {requesterNickname.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="line-clamp-1">{requesterNickname}</span>
              {typeof requesterRating === "number" ? (
                <span className="text-warning">★ {requesterRating.toFixed(1)}</span>
              ) : null}
            </div>
            <span className="shrink-0 tabular-nums">
              {applicantCount} 人应征
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
