"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  ShieldAlert,
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
  chooseProvider,
  confirmNeedMatchComplete,
  decideNeedMatchLiability,
  requestCancelNeedMatch,
  withdrawNeedMatch,
} from "@/app/(app)/needs/actions";
import { ReviewDialog } from "@/components/site/review-dialog";

type MatchStatus =
  | "APPLIED"
  | "MATCHED"
  | "CANCELLING"
  | "COMPLETED"
  | "CANCELLED"
  | "NOT_SELECTED";

export interface MatchActionsProps {
  matchId: string;
  role: "provider" | "requester";
  status: MatchStatus;
  isViewerFirstConfirmer: boolean;
  isCanceller: boolean;
  hasFirstConfirmer: boolean;
  /** 对方昵称(评价入口展示用)。 */
  counterpartyNickname?: string;
  /** 当前用户是否已对该对接评价过。 */
  hasReviewed?: boolean;
}

/**
 * 单笔 NeedMatch 行的动作按钮区(客户端)。
 *
 * APPLIED:
 *  - requester: 选择TA
 *  - provider: 等待选择
 * MATCHED: 确认完成(第一/第二) + 申请取消(→ CANCELLING)
 * CANCELLING: 非取消方决定免责 / 取消方等待
 * COMPLETED: 已完成 + 可互评
 * NOT_SELECTED/CANCELLED: 终态弱化徽章
 */
export function MatchActions({
  matchId,
  role,
  status,
  isViewerFirstConfirmer,
  isCanceller,
  hasFirstConfirmer,
  counterpartyNickname,
  hasReviewed,
}: MatchActionsProps) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = React.useState(false);

  // ── APPLIED ──
  if (status === "APPLIED") {
    // 发布者:选定提供者
    if (role === "requester") {
      function handleChoose() {
        startTransition(async () => {
          const res = await chooseProvider(matchId);
          if (res.ok) toast.success("已选定,等待对接");
          else toast.error(res.error);
        });
      }

      return (
        <Button
          size="sm"
          variant="success"
          onClick={handleChoose}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          选择TA
        </Button>
      );
    }

    // 提供者:等待选择 + 可撤回应征(PRD §4.7)
    function handleWithdraw() {
      startTransition(async () => {
        const res = await withdrawNeedMatch(matchId);
        if (res.ok) toast.success("已撤回应征");
        else toast.error(res.error);
      });
    }
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          等待选择
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleWithdraw}
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
        >
          撤回
        </Button>
      </div>
    );
  }

  // ── MATCHED ──
  if (status === "MATCHED") {
    const otherConfirmed = hasFirstConfirmer && !isViewerFirstConfirmer;

    function handleComplete() {
      startTransition(async () => {
        const res = await confirmNeedMatchComplete(matchId);
        if (res.ok) {
          if (res.completed) toast.success("对接已完成,请互评");
          else toast.success("已确认,等待对方确认");
        } else {
          toast.error(res.error);
        }
      });
    }

    function handleCancel() {
      startTransition(async () => {
        const res = await requestCancelNeedMatch(matchId);
        if (res.ok) {
          toast.success("已申请取消,等待对方决定");
          setCancelOpen(false);
        } else {
          toast.error(res.error);
        }
      });
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {otherConfirmed ? (
          <span className="text-xs text-verified">对方已确认完成</span>
        ) : null}
        <Button
          size="sm"
          variant="success"
          onClick={handleComplete}
          disabled={pending || isViewerFirstConfirmer}
        >
          {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          {isViewerFirstConfirmer ? "你已确认" : "确认完成"}
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
              申请取消
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>申请取消该对接?</DialogTitle>
              <DialogDescription>
                已撮合的对接取消需对方决定是否同意免责。不同意将记本次取消为违规。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={pending}>
                  再想想
                </Button>
              </DialogClose>
              <Button variant="danger" onClick={handleCancel} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                申请取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── CANCELLING ──
  if (status === "CANCELLING") {
    if (isCanceller) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          等待对方决定是否免责
        </span>
      );
    }

    function handleLiability(agree: boolean) {
      startTransition(async () => {
        const res = await decideNeedMatchLiability(matchId, agree);
        if (res.ok) {
          toast.success(agree ? "已同意免责" : "已记录对方违规");
        } else {
          toast.error(res.error);
        }
      });
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-warning">对方申请取消</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleLiability(true)}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          同意免责
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleLiability(false)}
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
        >
          {pending ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
          不同意(计违规)
        </Button>
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
        <ReviewDialog
          dealType="NEED_MATCH"
          dealId={matchId}
          revieweeNickname={counterpartyNickname}
          hasReviewed={hasReviewed}
        />
      </div>
    );
  }

  // ── NOT_SELECTED ──
  if (status === "NOT_SELECTED") {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        <XCircle className="size-3" />
        未被选中
      </Badge>
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
