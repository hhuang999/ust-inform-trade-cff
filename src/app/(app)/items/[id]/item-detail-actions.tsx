"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Heart,
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
import type { VerificationStatus } from "@/components/ui/badge";

import {
  cancelItemDeal,
  chooseBuyer,
  closeItem,
  confirmItemComplete,
  expressInterest,
  toggleFavorite,
} from "@/app/(app)/items/actions";

/** 意向点击时间格式化为 MM-DD。 */
function formatInterestTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * 买家侧动作卡(已认证、非卖家)。
 * - 我想要(expressInterest)、收藏(toggleFavorite)、联系方式展示。
 */
function BuyerActions({
  itemId,
  contact,
  isFavorited,
  hasInterest,
}: {
  itemId: string;
  contact: string | null;
  isFavorited: boolean;
  hasInterest: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = React.useState(isFavorited);
  const [interested, setInterested] = React.useState(hasInterest);

  function handleInterest() {
    if (interested) return;
    startTransition(async () => {
      const res = await expressInterest(itemId);
      if (res.ok) {
        setInterested(true);
        toast.success("已加入意向列表");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleFavorite() {
    startTransition(async () => {
      const res = await toggleFavorite(itemId);
      if (res.ok) {
        setFavorited(res.favorited);
        toast.success(res.favorited ? "已收藏" : "已取消收藏");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleInterest}
            disabled={pending || interested}
            className="w-full active:scale-[0.98]"
          >
            {pending && !interested ? (
              <Loader2 className="animate-spin" />
            ) : interested ? (
              <CheckCircle2 />
            ) : (
              <ShoppingBag />
            )}
            {interested ? "已意向" : "我想要"}
          </Button>

          <Button
            variant="outline"
            onClick={handleFavorite}
            disabled={pending}
            className="w-full active:scale-[0.98]"
          >
            {pending && interested ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Heart className={cn(favorited && "fill-destructive text-destructive")} />
            )}
            {favorited ? "已收藏" : "收藏"}
          </Button>
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
              <span>联系方式仅认证用户可见</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 未登录 / 未认证 时的提示卡。
 */
function GuestActions({ hasSession }: { hasSession: boolean }) {
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
          <TooltipContent>
            {hasSession ? "完成认证后即可表达意向" : "登录后即可表达意向"}
          </TooltipContent>
        </Tooltip>

        <Separator />

        <div className="flex items-start gap-2.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm text-muted-foreground ring-1 ring-inset ring-outline-variant/40">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            {hasSession
              ? "完成认证后可查看联系方式并与卖家沟通"
              : "登录并完成认证后查看联系方式"}
          </span>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={hasSession ? "/settings" : "/login"}>
            {hasSession ? "去认证" : "去登录"}
          </Link>
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
}: {
  dealId: string;
  dealStatus: "PENDING" | "COMPLETED";
  counterpartyLabel: string;
  counterpartyNickname: string;
  firstConfirmerId: string | null;
  viewerId: string;
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
}: {
  itemId: string;
  interests: InterestSummary[];
  currentDeal: CurrentDeal | null;
  viewerId: string;
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
          />
        ) : null}

        {interests.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无意向人
          </p>
        ) : (
          <ul className="space-y-2">
            {interests.map((it) => {
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
                  </div>
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
  isFavorited: boolean;
  hasInterest: boolean;
  contact: string | null;
  interests: InterestSummary[];
  currentDeal: CurrentDeal | null;
  sellerNickname: string | null;
}

/**
 * 详情页右侧动作区(客户端)。根据身份渲染买家/卖家/游客视图。
 */
export function ItemDetailActions({
  itemId,
  isSeller,
  viewerVerified,
  viewerId,
  isFavorited,
  hasInterest,
  contact,
  interests,
  currentDeal,
  sellerNickname,
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
        />
      </div>
    );
  }

  // 非卖家:已认证 → 买家动作;否则游客提示。
  if (viewerVerified === true) {
    // 当前买家正是这笔进行中/已完成交易的对象 → 显示确认完成卡。
    const isBuyerInDeal =
      !!currentDeal && !!viewerId && currentDeal.buyerId === viewerId;
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
          />
        ) : null}
        <BuyerActions itemId={itemId} contact={contact} isFavorited={isFavorited} hasInterest={hasInterest} />
      </div>
    );
  }

  return <GuestActions hasSession={viewerVerified !== null} />;
}
