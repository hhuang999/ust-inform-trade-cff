import Link from "next/link";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type ItemCardStatus = "AVAILABLE" | "PENDING" | "SOLD" | "CLOSED";

export interface ItemCardProps {
  id: string;
  title: string;
  priceMode: "SPECIFIC" | "FREE" | "NEGOTIABLE";
  price?: number | null;
  firstImageKey?: string | null;
  category: string;
  condition: string;
  sellerNickname: string;
  sellerRating?: number | null;
  status: ItemCardStatus;
  createdAt?: Date | string;
}

/** 根据 imageKey 解析 R2 公开访问 URL;base URL 缺失时返回 null(走占位)。 */
function publicUrl(imageKey?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!imageKey || !base) return null;
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

/** 渲染价格:免费 / 面议 / ¥金额。 */
function renderPrice(
  priceMode: ItemCardProps["priceMode"],
  price?: number | null
): string {
  if (priceMode === "FREE") return "免费";
  if (priceMode === "NEGOTIABLE") return "面议";
  if (typeof price === "number") return `¥${price.toLocaleString("zh-CN")}`;
  return "面议";
}

/**
 * 物品卡片(展示型,可用于列表页与首页)。无 hooks,可在服务端组件中使用。
 */
export function ItemCard({
  id,
  title,
  priceMode,
  price,
  firstImageKey,
  category,
  condition,
  sellerNickname,
  sellerRating,
  status,
}: ItemCardProps) {
  const img = publicUrl(firstImageKey);
  const isClosed = status === "SOLD" || status === "CLOSED";

  return (
    <Link href={`/items/${id}`} className="group block">
      <Card
        overflow-hidden
        rounded-xl
        gap-0
        py-0
        className={cn(
          "h-full overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-float",
          isClosed && "opacity-70"
        )}
      >
        {/* 图片区 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-accent">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8 opacity-60" />
            </div>
          )}
          {status === "PENDING" ? (
            <span className="absolute left-2 top-2">
              <Badge variant="secondary" className="bg-warning/90 text-white">
                交易中
              </Badge>
            </span>
          ) : null}
          {isClosed ? (
            <span className="absolute left-2 top-2">
              <Badge variant="outline" className="bg-card/90 text-muted-foreground">
                {status === "SOLD" ? "已售出" : "已关闭"}
              </Badge>
            </span>
          ) : null}
        </div>

        {/* 文案区 */}
        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-1 font-serif text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="font-serif text-lg tabular-nums text-primary">
            {renderPrice(priceMode, price)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="font-normal">
              {category}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {condition}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">
                {sellerNickname.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="line-clamp-1">{sellerNickname}</span>
            {typeof sellerRating === "number" ? (
              <span className="text-warning">★ {sellerRating.toFixed(1)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
