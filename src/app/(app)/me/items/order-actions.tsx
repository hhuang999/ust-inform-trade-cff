"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import {
  cancelItemDeal,
  confirmItemComplete,
} from "@/app/(app)/items/actions";

export interface OrderActionsProps {
  dealId: string;
  itemId: string;
  isSeller: boolean;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  /** null = 尚无人确认;否则为第一确认人 id。 */
  firstConfirmerId: string | null;
  viewerId: string;
  /** 已完成时间(ISO 串)或 null;仅展示用。 */
  completedAt?: string | null;
}

/**
 * 单笔 ItemDeal 行的动作按钮区(客户端)。
 *
 * PENDING:
 *  - firstConfirmerId === viewerId  → 「你已确认,等待对方确认」(禁用)
 *  - firstConfirmerId 存在且 !== viewerId → 「对方已确认完成」+ 主按钮「确认完成」(第二确认)
 *  - firstConfirmerId 为 null → 主按钮「确认完成」(第一确认)
 *  - 总是提供「取消交易」(经 Dialog 二次确认,no-fault)。
 * COMPLETED → 「已完成」徽章 + 「可互评」提示(评价 UI 为 Phase 5)。
 * CANCELLED → 「已取消」弱化展示。
 */
export function OrderActions({
  dealId,
  status,
  firstConfirmerId,
  viewerId,
}: OrderActionsProps) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = React.useState(false);

  // ── PENDING ──
  if (status === "PENDING") {
    const youConfirmed = firstConfirmerId === viewerId;
    const otherConfirmed = !!firstConfirmerId && !youConfirmed;

    function handleConfirm() {
      startTransition(async () => {
        const res = await confirmItemComplete(dealId);
        if (res.ok) {
          if (res.completed) toast.success("交易已完成,请互评");
          else toast.success("已确认,等待对方确认");
        } else {
          toast.error(res.error);
        }
      });
    }

    function handleCancel() {
      startTransition(async () => {
        const res = await cancelItemDeal(dealId);
        if (res.ok) {
          toast.success("交易已取消");
          setCancelOpen(false);
        } else {
          toast.error(res.error);
        }
      });
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {otherConfirmed ? (
          <span className="text-xs text-verified">
            对方已确认完成
          </span>
        ) : null}
        <Button
          size="sm"
          variant="success"
          onClick={handleConfirm}
          disabled={pending || youConfirmed}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : youConfirmed ? (
            <CheckCircle2 />
          ) : (
            <CheckCircle2 />
          )}
          {youConfirmed ? "你已确认" : "确认完成"}
        </Button>

        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              className="text-muted-foreground hover:text-destructive"
            >
              <XCircle />
              取消交易
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认取消交易?</DialogTitle>
              <DialogDescription>
                取消后物品将重新上架为可购买状态,对方与所有意向人都会收到通知。
                本次取消为免责,不会影响双方信用。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={pending}>
                  再想想
                </Button>
              </DialogClose>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={pending}
              >
                {pending ? <Loader2 className="animate-spin" /> : null}
                确认取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── COMPLETED ──
  if (status === "COMPLETED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" className="font-normal">
          <CheckCircle2 className="size-3" />
          已完成
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          可互评
        </span>
      </div>
    );
  }

  // ── CANCELLED ──
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      <XCircle className="size-3" />
      已取消
    </Badge>
  );
}
