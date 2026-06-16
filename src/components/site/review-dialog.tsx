"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { createReview } from "@/app/(app)/reviews/actions";

export interface ReviewDialogProps {
  dealType: "ITEM" | "BOOKING" | "NEED_MATCH";
  dealId: string;
  revieweeNickname?: string;
  hasReviewed?: boolean;
  trigger?: React.ReactNode;
}

const MAX_LEN = 200;

/**
 * 评价对话框(双盲)。1-5 星选择 + 评价内容(≤200)。
 * 已评价时渲染禁用的「已评价」状态。
 */
export function ReviewDialog({
  dealType,
  dealId,
  revieweeNickname,
  hasReviewed,
  trigger,
}: ReviewDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [content, setContent] = React.useState("");

  const revieweeLabel = revieweeNickname ? `「${revieweeNickname}」` : "对方";

  function reset() {
    setRating(0);
    setHover(0);
    setContent("");
  }

  function handleSubmit() {
    if (rating < 1 || rating > 5) {
      toast.error("请选择 1-5 星评分");
      return;
    }
    startTransition(async () => {
      const res = await createReview({
        dealType,
        dealId,
        rating,
        content: content.trim() || null,
      });
      if (res.ok) {
        toast.success(
          res.revealed
            ? "双方均已评价,已公开"
            : "评价已提交"
        );
        reset();
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  // 已评价:禁用态。
  if (hasReviewed) {
    return (
      <Button size="sm" variant="outline" disabled>
        <Star className="size-3.5 text-warning" />
        已评价
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Star className="size-3.5 text-warning" />
            评价
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>评价 {revieweeLabel}</DialogTitle>
          <DialogDescription>
            本次交易已完成,请对交易体验作出评价。双方均提交后评价才会公开。
          </DialogDescription>
        </DialogHeader>

        {/* 星级选择 */}
        <div className="space-y-1.5">
          <span className="text-sm text-muted-foreground">评分</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hover || rating);
              return (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} 星`}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Star
                    className={cn(
                      "size-7 transition-colors",
                      active
                        ? "fill-warning text-warning"
                        : "fill-transparent text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 评价内容 */}
        <div className="space-y-1.5">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            placeholder="说说本次交易体验(可选)"
            rows={4}
            maxLength={MAX_LEN}
          />
          <div className="flex justify-end text-xs text-muted-foreground tabular-nums">
            {content.length}/{MAX_LEN}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              取消
            </Button>
          </DialogClose>
          <Button variant="default" onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            提交评价
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
