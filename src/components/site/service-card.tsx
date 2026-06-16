import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type ServiceCardStatus = "ACTIVE" | "PAUSED" | "CLOSED";

export interface ServiceCardProps {
  id: string;
  title: string;
  providerNickname: string;
  categories: string[];
  formats: string[];
  price: string;
  durationTier?: string | null;
  proofFirstImageKey?: string | null;
  rating?: number | null;
  status: ServiceCardStatus;
  createdAt?: Date | string;
}

/** 根据 imageKey 解析 R2 公开访问 URL;base URL 缺失时返回 null(走占位图标)。 */
function publicUrl(imageKey?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!imageKey || !base) return null;
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

/**
 * 服务卡片(展示型,可用于列表页与首页)。无 hooks,可在服务端组件中使用。
 */
export function ServiceCard({
  id,
  title,
  providerNickname,
  categories,
  formats,
  price,
  durationTier,
  proofFirstImageKey,
  rating,
  status,
}: ServiceCardProps) {
  const img = publicUrl(proofFirstImageKey);
  const inactive = status === "PAUSED" || status === "CLOSED";

  return (
    <Link href={`/services/${id}`} className="group block">
      <Card
        className={cn(
          "h-full overflow-hidden rounded-xl border border-outline-variant/40 bg-card py-0 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-float",
          inactive && "opacity-70"
        )}
      >
        {/* 顶部图标 / 资质图区 */}
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-primary-container/60">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Sparkles className="size-8 text-primary/60" />
          )}

          {status === "PAUSED" ? (
            <span className="absolute left-2 top-2">
              <Badge variant="secondary" className="bg-warning/90 text-white">
                已暂停
              </Badge>
            </span>
          ) : null}
          {status === "CLOSED" ? (
            <span className="absolute left-2 top-2">
              <Badge variant="outline" className="bg-card/90 text-muted-foreground">
                已关闭
              </Badge>
            </span>
          ) : null}
        </div>

        {/* 文案区 */}
        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 font-serif text-base font-semibold text-foreground">
            {title}
          </h3>

          {/* 形式徽章 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {formats.length > 0 ? (
              formats.map((f) => (
                <Badge key={f} variant="outline" className="font-normal">
                  {f}
                </Badge>
              ))
            ) : null}
            {durationTier ? (
              <Badge variant="secondary" className="font-normal">
                {durationTier}
              </Badge>
            ) : null}
          </div>

          {/* 价格 */}
          <p className="line-clamp-1 font-serif text-lg tabular-nums text-primary">
            {price}
          </p>

          {/* 分类 */}
          {categories.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {categories.slice(0, 3).map((c) => (
                <span key={c}>#{c}</span>
              ))}
            </div>
          ) : null}

          {/* 提供者 */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">
                <GraduationCap className="size-3" />
              </AvatarFallback>
            </Avatar>
            <span className="line-clamp-1">{providerNickname}</span>
            {typeof rating === "number" ? (
              <span className="text-warning">★ {rating.toFixed(1)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
