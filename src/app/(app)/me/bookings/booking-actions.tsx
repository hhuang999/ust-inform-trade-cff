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

import {
  confirmBooking,
  confirmBookingComplete,
  decideBookingLiability,
  rejectBooking,
  requestCancelBooking,
} from "@/app/(app)/services/actions";
import { ReviewDialog } from "@/components/site/review-dialog";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface BookingActionsProps {
  bookingId: string;
  role: "provider" | "client";
  status: BookingStatus;
  /** 当前用户是否为第一确认人(null 时表示尚无人确认)。 */
  isViewerFirstConfirmer: boolean;
  /** 当前用户是否为发起取消的一方(CANCELLING 时使用)。 */
  isCanceller: boolean;
  /** 是否已有第一确认人(用于区分第一/第二确认)。 */
  hasFirstConfirmer: boolean;
  /** 拒绝原因(REJECTED 时展示)。 */
  rejectReason?: string | null;
  /** 对方昵称(评价入口展示用)。 */
  counterpartyNickname?: string;
  /** 当前用户是否已对该预约评价过。 */
  hasReviewed?: boolean;
}

/**
 * 单笔 Booking 行的动作按钮区(客户端)。
 *
 * PENDING:
 *  - provider: 确认接单 + 拒绝(Dialog reason)
 *  - client: 取消预约(no-fault → CANCELLED)
 * CONFIRMED: 确认完成(第一/第二) + 申请取消(→ CANCELLING)
 * CANCELLING: 非取消方决定免责 / 取消方等待
 * COMPLETED: 已完成 + 可互评
 * REJECTED/CANCELLED: 终态弱化徽章
 */
export function BookingActions({
  bookingId,
  role,
  status,
  isViewerFirstConfirmer,
  isCanceller,
  hasFirstConfirmer,
  rejectReason,
  counterpartyNickname,
  hasReviewed,
}: BookingActionsProps) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // ── PENDING ──
  if (status === "PENDING") {
    // 提供者:确认接单 / 拒绝
    if (role === "provider") {
      function handleConfirm() {
        startTransition(async () => {
          const res = await confirmBooking(bookingId);
          if (res.ok) toast.success("已确认接单");
          else toast.error(res.error);
        });
      }

      function handleReject() {
        const trimmed = reason.trim();
        if (!trimmed) {
          toast.error("请填写拒绝原因");
          return;
        }
        startTransition(async () => {
          const res = await rejectBooking(bookingId, trimmed);
          if (res.ok) {
            toast.success("已拒绝该预约");
            setRejectOpen(false);
            setReason("");
          } else {
            toast.error(res.error);
          }
        });
      }

      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            确认接单
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle />
                拒绝
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>拒绝该预约?</DialogTitle>
                <DialogDescription>
                  拒绝后该预约将转为「已拒绝」状态,对方会收到通知。请填写原因。
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="如:该时段已有其他安排 / 资质不匹配……"
                rows={3}
                maxLength={200}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={pending}>
                    再想想
                  </Button>
                </DialogClose>
                <Button variant="danger" onClick={handleReject} disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : null}
                  确认拒绝
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // 客户:取消预约(no-fault)
    function handleCancel() {
      startTransition(async () => {
        const res = await requestCancelBooking(bookingId);
        if (res.ok) {
          toast.success("已取消预约");
          setCancelOpen(false);
        } else {
          toast.error(res.error);
        }
      });
    }

    return (
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            className="text-muted-foreground hover:text-destructive"
          >
            <XCircle />
            取消预约
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消该预约?</DialogTitle>
            <DialogDescription>
              尚未确认的预约取消为免责取消,不会影响双方信用。
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
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── CONFIRMED ──
  if (status === "CONFIRMED") {
    const otherConfirmed = hasFirstConfirmer && !isViewerFirstConfirmer;

    function handleComplete() {
      startTransition(async () => {
        const res = await confirmBookingComplete(bookingId);
        if (res.ok) {
          if (res.completed) toast.success("服务已完成,请互评");
          else toast.success("已确认,等待对方确认");
        } else {
          toast.error(res.error);
        }
      });
    }

    function handleCancel() {
      startTransition(async () => {
        const res = await requestCancelBooking(bookingId);
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
              <DialogTitle>申请取消该预约?</DialogTitle>
              <DialogDescription>
                已确认的预约取消需对方决定是否同意免责。不同意将记本次取消为违规。
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
    // 发起方:等待对方决定
    if (isCanceller) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          等待对方决定是否免责
        </span>
      );
    }

    // 非取消方:决定免责
    function handleLiability(agree: boolean) {
      startTransition(async () => {
        const res = await decideBookingLiability(bookingId, agree);
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
          dealType="BOOKING"
          dealId={bookingId}
          revieweeNickname={counterpartyNickname}
          hasReviewed={hasReviewed}
        />
      </div>
    );
  }

  // ── REJECTED ──
  if (status === "REJECTED") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          <XCircle className="size-3" />
          已拒绝
        </Badge>
        {rejectReason ? (
          <span className="max-w-[16rem] text-right text-xs text-muted-foreground">
            原因:{rejectReason}
          </span>
        ) : null}
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
