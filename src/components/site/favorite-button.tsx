"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { type FavoriteTargetType } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/app/(app)/me/favorites/actions";

/**
 * 收藏切换(角落心形图标)。物品 / 服务 / 需求 详情页通用。
 * 设计为轻量"稍后再看"书签,与"我想要/预约/应征"主操作区分开。
 */
export function FavoriteButton({
  targetType,
  targetId,
  favorited,
  className,
}: {
  targetType: FavoriteTargetType;
  targetId: string;
  favorited: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [on, setOn] = React.useState(favorited);

  function handle() {
    startTransition(async () => {
      const res = await toggleFavorite(targetType, targetId);
      if (res.ok) {
        setOn(res.favorited);
        toast.success(res.favorited ? "已收藏" : "已取消收藏");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={on ? "取消收藏" : "收藏"}
      title={on ? "取消收藏" : "收藏"}
      onClick={handle}
      disabled={pending}
      className={cn("shrink-0", className)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart
          className={cn("size-5", on && "fill-destructive text-destructive")}
        />
      )}
    </Button>
  );
}
