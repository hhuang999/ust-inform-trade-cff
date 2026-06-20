"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import type { VerificationStatus } from "@/components/ui/badge";

import {
  cancelItemDeal,
  chooseBuyer,
  closeItem,
  confirmItemComplete,
  expressInterest,
} from "@/app/(app)/items/actions";
import { formatDate as formatInterestTime } from "@/lib/time";
import { ReviewDialog } from "@/components/site/review-dialog";

// 意向点击时间统一来自 @/lib/time(formatDate),显式 Asia/Shanghai,且带年份避免跨年混淆。

/**
 * 买家侧动作卡(已登录、非卖家)。
 * - 我想要(expressInterest,可附留言):加入卖家意向队列。
 * - 队列状态:自己的排位 / 是否被选为备选(卖家已选定他人)。
 * - 联系方式展示。
 */
function BuyerActions({
  itemId,
  contact,
  hasInterest,
  viewerInterestRank,
  chosenOtherBuyer,
}: {
  itemId: string;
  contact: string | null;
  hasInterest: boolean;
  viewerInterestRank: number | null;
  chosenOtherBuyer: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [interested, setInterested] = React.useState(hasInterest);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  function handleSubmit() {
    startTransition(async () => {
      const res = await expressInterest(itemId, message.trim() || undefined);
      if (res.ok) {
        setInterested(true);
        setOpen(false);
        setMessage("");
        toast.success("已加入意向列表");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          {interested ? (
            <Button disabled className="w-full">
              <CheckCircle2 />
              已意向
            </Button>
          ) : (
            <Button
              onClick={() => setOpen(true)}
              disabled={pending}
              className="w-full active:scale-[0.98]"
            >
              {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              我想要
            </Button>
          )}

          {/* 队列状态 / 操作说明 */}
          {interested ? (
            <p className="rounded-md bg-accent/60 px-3 py-2 text-xs text-muted-foreground">
              {chosenOtherBuyer
                ? `你是第 ${viewerInterestRank ?? "-"} 位意向人。卖家已选定其他买家,你为备选;若对方取消交易将通知你。`
                : `你是第 ${viewerInterestRank ?? "-"} 位意向人,等待卖家选择。`}
            </p>
          ) : (
            <p className="px-1 text-xs text-muted-foreground">
              点击后加入意向队列,卖家会在意向列表中看到你(可附留言)。
            </p>
          )}
          {interested ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="#messages">
                <MessageCircle />
                给卖家留言
              </Link>
            </Button>
          ) : null}
        </div>

        <Separator />

        {/* 联系方式 */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            联系方式
          </p>
          {contact ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-verified-soft px-3.5 py-2.5 text-sm text-verified ring-1 ring-inset ring-verified/20">
              <MessageCircle className="mt-0.5 size-4 shrink-0" />
              <span className="break-all">{contact}</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm text-muted-foreground ring-1 ring-inset ring-outline-variant/40">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>卖家暂未提供联系方式</span>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>我想要这件物品</DialogTitle>
              <DialogDescription>
                加入意向队列,卖家会在意向列表中看到你。可附留言说明你的意向。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                给卖家留言(可选)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例如:想约周三自提 / 价格能否小刀 / 我很有诚意…"
                rows={3}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                确认意向
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * 未登录时的提示卡(登录即可使用全部功能,认证仅为信任徽章)。
 */
function GuestActions() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block w-full">
              <Button disabled className="w-full">
                <ShoppingBag />
                我想要
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>登录后即可表达意向</TooltipContent>
        </Tooltip>

        <Separator />

        <div className="flex items-start gap-2.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm text-muted-foreground ring-1 ring-inset ring-outline-variant/40">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>登录后即可查看联系方式并与卖家沟通</span>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">去登录</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 卖家侧的当前交易状态行。
 * 仅当存在 PENDING/COMPLETED 交易时渲染。
 */
function DealStatusRow({
  dealId,
  dealStatus,
  counterpartyLabel,
  counterpartyNickname,
  firstConfirmerId,
  viewerId,
  hasReviewed,
}: {
  dealId: string;
  dealStatus: "PENDING" | "COMPLETED";
  counterpartyLabel: string;
  counterpartyNickname: string;
  firstConfirmerId: string | null;
  viewerId: string;
  hasReviewed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const youConfirmed = firstConfirmerId === viewerId;

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmItemComplete(dealId);
      if (res.ok) {
        toast.success(res.completed ? "交易已完成" : "已确认,等待对方确认");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelItemDeal(dealId);
      if (res.ok) {
        toast.success("已取消交易");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-accent/50 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        当前交易 · {dealStatus === "COMPLETED" ? "已完成" : "进行中"}
      </p>
      <p className="mb-3 text-sm text-foreground">
        {counterpartyLabel}：<span className="font-medium">{counterpartyNickname}</span>
      </p>
      {dealStatus === "PENDING" ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={handleConfirm}
            disabled={pending || youConfirmed}
          >
            <CheckCircle2 />
            {youConfirmed ? "你已确认" : "确认完成"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={pending}
          >
            <XCircle />
            取消交易
          </Button>
        </div>
      ) : null}
      {dealStatus === "COMPLETED" ? (
        <ReviewDialog
          dealType="ITEM"
          dealId={dealId}
          revieweeNickname={counterpartyNickname}
          hasReviewed={hasReviewed}
        />
      ) : null}
    </div>
  );
}

/**
 * 卖家的意向人列表卡(含选择买家、当前交易状态)。
 */
function SellerInterests({
  itemId,
  interests,
  currentDeal,
  viewerId,
  hasReviewed,
}: {
  itemId: string;
  interests: InterestSummary[];
  currentDeal: CurrentDeal | null;
  viewerId: string;
  hasReviewed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleChoose(buyerUserId: string) {
    startTransition(async () => {
      const res = await chooseBuyer(itemId, buyerUserId);
      if (res.ok) {
        toast.success("已选定买家");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="size-4 text-primary" />
          意向人
          <Badge variant="secondary" className="font-normal">
            {interests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentDeal ? (
          <DealStatusRow
            dealId={currentDeal.dealId}
            dealStatus={currentDeal.status}
            counterpartyLabel="买家"
            counterpartyNickname={currentDeal.buyerNickname}
            firstConfirmerId={currentDeal.firstConfirmerId}
            viewerId={viewerId}
            hasReviewed={hasReviewed}
          />
        ) : null}

        {interests.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无意向人
          </p>
        ) : (
          <ul className="space-y-2">
            {interests.map((it, idx) => {
              const isCurrentBuyer = currentDeal?.buyerId === it.userId;
              return (
                <li
                  key={it.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-card p-2.5",
                    isCurrentBuyer && "ring-1 ring-primary/40"
                  )}
                >
                  <Avatar className="size-9">
                    {it.avatarUrl ? (
                      <AvatarImage src={it.avatarUrl} alt={it.nickname} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {it.nickname.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        第 {idx + 1} 位
                      </Badge>
                      <span className="truncate text-sm font-medium">
                        {it.nickname}
                      </span>
                      <Badge status={it.verificationStatus} />
                      {typeof it.rating === "number" ? (
                        <span className="text-xs text-warning">
                          ★ {it.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {it.department} · {it.enrollmentYear} 级 · 点击于{" "}
                      {formatInterestTime(it.createdAt)}
                    </p>
                    {it.message ? (
                      <p className="mt-1 rounded-md bg-accent/60 px-2 py-1 text-xs text-foreground/80">
                        {it.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {isCurrentBuyer ? (
                      <Badge variant="success" className="font-normal">
                        已选定
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChoose(it.userId)}
                        disabled={pending}
                      >
                        选择与TA交易
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                    >
                      <Link href={`/items/${itemId}?with=${it.userId}#messages`}>
                        私信
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 卖家动作卡:编辑 / 下架。
 */
function SellerActions({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClose() {
    if (typeof window !== "undefined") {
      if (!window.confirm("确定要下架该物品吗?")) return;
    }
    startTransition(async () => {
      const res = await closeItem(itemId);
      if (res.ok) {
        toast.success("已下架");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <Button asChild variant="default" className="w-full active:scale-[0.98]">
          <Link href={`/items/${itemId}/edit`}>
            <Pencil />
            编辑
          </Link>
        </Button>
        <Button
          variant="danger"
          onClick={handleClose}
          disabled={pending}
          className="w-full active:scale-[0.98]"
        >
          {pending ? <Loader2 className="animate-spin" /> : <XCircle />}
          下架
        </Button>
      </CardContent>
    </Card>
  );
}

export interface InterestSummary {
  userId: string;
  nickname: string;
  department: string;
  enrollmentYear: number;
  verificationStatus: VerificationStatus;
  avatarUrl: string | null;
  rating?: number | null;
  message: string | null;
  createdAt: string;
}

export interface CurrentDeal {
  dealId: string;
  buyerId: string;
  buyerNickname: string;
  status: "PENDING" | "COMPLETED";
  firstConfirmerId: string | null;
}

export interface ItemDetailActionsProps {
  itemId: string;
  isSeller: boolean;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
  viewerId: string | null;
  hasInterest: boolean;
  contact: string | null;
  interests: InterestSummary[];
  currentDeal: CurrentDeal | null;
  sellerNickname: string | null;
  itemStatus: "AVAILABLE" | "PENDING" | "SOLD" | "CLOSED";
  hasReviewed: boolean;
  /** 当前用户在意向队列中的排位(服务端计算,无需下发完整列表)。 */
  viewerInterestRank: number | null;
}

/**
 * 详情页右侧动作区(客户端)。根据身份渲染买家/卖家/游客视图。
 */
export function ItemDetailActions({
  itemId,
  isSeller,
  viewerVerified,
  viewerId,
  hasInterest,
  contact,
  interests,
  currentDeal,
  sellerNickname,
  itemStatus,
  hasReviewed,
  viewerInterestRank,
}: ItemDetailActionsProps) {
  if (isSeller) {
    if (!viewerId) return null;
    return (
      <div className="space-y-4">
        <SellerActions itemId={itemId} />
        <SellerInterests
          itemId={itemId}
          interests={interests}
          currentDeal={currentDeal}
          viewerId={viewerId}
          hasReviewed={hasReviewed}
        />
      </div>
    );
  }

  // 非卖家:已登录(含未认证) → 买家动作;未登录 → 游客提示。
  if (viewerVerified !== null) {
    // 当前买家正是这笔进行中/已完成交易的对象 → 显示确认完成卡。
    const isBuyerInDeal =
      !!currentDeal && !!viewerId && currentDeal.buyerId === viewerId;
    // 卖家是否已选定其他买家(当前用户为备选)。
    const chosenOtherBuyer = !!currentDeal && currentDeal.buyerId !== viewerId;
    // 已售出且当前用户非该笔买家 → 不再显示"我想要",改为售罄提示。
    const soldToOther = itemStatus === "SOLD" && !isBuyerInDeal;
    return (
      <div className="space-y-4">
        {isBuyerInDeal ? (
          <DealStatusRow
            dealId={currentDeal!.dealId}
            dealStatus={currentDeal!.status}
            counterpartyLabel="卖家"
            counterpartyNickname={sellerNickname ?? "卖家"}
            firstConfirmerId={currentDeal!.firstConfirmerId}
            viewerId={viewerId!}
            hasReviewed={hasReviewed}
          />
        ) : null}
        {soldToOther ? (
          <Card>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="size-4" />
              该物品已售出
            </CardContent>
          </Card>
        ) : (
          <BuyerActions
            itemId={itemId}
            contact={contact}
            hasInterest={hasInterest}
            viewerInterestRank={viewerInterestRank}
            chosenOtherBuyer={chosenOtherBuyer}
          />
        )}
      </div>
    );
  }

  return <GuestActions />;
}
