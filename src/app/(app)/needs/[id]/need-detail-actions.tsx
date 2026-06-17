"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { type NeedMatchStatus } from "@prisma/client";
import {
  CheckCircle2,
  HandHeart,
  Loader2,
  MessageCircle,
  Pause,
  Pencil,
  Play,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, type VerificationStatus } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  applyToNeed,
  chooseProvider,
  closeNeed,
  confirmNeedMatchComplete,
  decideNeedMatchLiability,
  pauseNeed,
  requestCancelNeedMatch,
  resumeNeed,
} from "@/app/(app)/needs/actions";

// ───────────────────────── 共享类型(可序列化) ─────────────────────────

export interface ApplicantSummary {
  matchId: string;
  providerId: string;
  nickname: string;
  department: string;
  enrollmentYear: number;
  verificationStatus: VerificationStatus;
  message: string;
}

export interface MatchedSummary {
  matchId: string;
  providerId: string;
  nickname: string;
  status: NeedMatchStatus;
  isViewerFirstConfirmer: boolean;
  isCanceller: boolean;
}

export interface NeedDetailActionsProps {
  needId: string;
  status: "OPEN" | "PAUSED" | "CLOSED";
  isRequester: boolean;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
  viewerId: string | null;
  contact: string | null;
  applicants: ApplicantSummary[];
  matches: MatchedSummary[];
  viewerApplied: boolean;
}

const MATCH_STATUS_LABEL: Record<MatchedSummary["status"], string> = {
  APPLIED: "待选择",
  MATCHED: "已撮合",
  CANCELLING: "取消协商中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  NOT_SELECTED: "未被选中",
};

// ───────────────────────── 联系方式块 ─────────────────────────

function ContactBlock({ contact }: { contact: string | null }) {
  return (
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
  );
}

// ───────────────────────── 撮合状态行(双方共用) ─────────────────────────

function MatchStatusRow({ match }: { match: MatchedSummary }) {
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const res = await confirmNeedMatchComplete(match.matchId);
      if (res.ok) {
        toast.success(res.completed ? "对接已完成" : "已确认,等待对方确认");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await requestCancelNeedMatch(match.matchId);
      if (res.ok) {
        toast.success("已发起取消请求");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDecide(agree: boolean) {
    startTransition(async () => {
      const res = await decideNeedMatchLiability(match.matchId, agree);
      if (res.ok) {
        toast.success(agree ? "已同意免责,取消完成" : "已不同意免责,记录对方违规");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-accent/50 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        当前对接 · {MATCH_STATUS_LABEL[match.status]}
      </p>
      <p className="mb-3 text-sm text-foreground">
        对方：<span className="font-medium">{match.nickname}</span>
      </p>

      {match.status === "MATCHED" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={handleComplete}
            disabled={pending || match.isViewerFirstConfirmer}
          >
            <CheckCircle2 />
            {match.isViewerFirstConfirmer ? "你已确认" : "确认完成"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={pending}
          >
            <XCircle />
            申请取消
          </Button>
        </div>
      ) : null}

      {match.status === "CANCELLING" ? (
        match.isCanceller ? (
          <p className="text-xs text-muted-foreground">
            你已申请取消,等待对方决定是否同意免责。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDecide(true)}
              disabled={pending}
            >
              同意免责
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDecide(false)}
              disabled={pending}
            >
              不同意(记对方违规)
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}

// ───────────────────────── 发布者侧:应征者列表 ─────────────────────────

function RequesterApplicants({
  applicants,
  matches,
}: {
  applicants: ApplicantSummary[];
  matches: MatchedSummary[];
}) {
  const [pendingId, startTransition] = useTransition();

  function handleChoose(matchId: string) {
    startTransition(async () => {
      const res = await chooseProvider(matchId);
      if (res.ok) {
        toast.success("已选定提供者");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-primary" />
          应征者
          <Badge variant="secondary" className="font-normal">
            {applicants.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.length > 0 ? (
          <p className="rounded-md bg-verified-soft/60 px-3 py-2 text-xs text-foreground/80">
            已选定 {matches.length} 位提供者
            {applicants.length > 0 ? ` · 另有 ${applicants.length} 位候选中` : ""}
          </p>
        ) : applicants.length > 0 ? (
          <p className="rounded-md bg-accent/60 px-3 py-2 text-xs text-muted-foreground">
            当前 {applicants.length} 位候选应征;选定一位后,其余仍保留为候选。
          </p>
        ) : null}

        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((m) => (
              <MatchStatusRow key={m.matchId} match={m} />
            ))}
            <Separator />
          </div>
        ) : null}

        {applicants.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无应征者
          </p>
        ) : (
          <ul className="space-y-2">
            {applicants.map((a) => (
              <li
                key={a.matchId}
                className="rounded-lg border border-outline-variant/40 bg-card p-2.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {a.nickname.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium">
                        {a.nickname}
                      </span>
                      <Badge status={a.verificationStatus} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.department} · {a.enrollmentYear} 级
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleChoose(a.matchId)}
                    disabled={pendingId !== null}
                  >
                    选择TA
                  </Button>
                </div>
                {a.message ? (
                  <p className="mt-2 rounded-md bg-accent/60 px-2 py-1.5 text-xs text-foreground/80">
                    {a.message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────────────────── 发布者侧:生命周期 ─────────────────────────

function RequesterLifecycle({
  needId,
  status,
}: {
  needId: string;
  status: "OPEN" | "PAUSED" | "CLOSED";
}) {
  const [pending, startTransition] = useTransition();

  function run(
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
    confirmMsg?: string
  ) {
    if (confirmMsg && typeof window !== "undefined") {
      if (!window.confirm(confirmMsg)) return;
    }
    startTransition(async () => {
      const res = await fn(needId);
      if (res.ok) {
        toast.success(successMsg);
      } else {
        toast.error(res.error ?? "操作失败");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        {(status === "OPEN" || status === "PAUSED") ? (
          <Button asChild className="w-full">
            <Link href={`/needs/${needId}/edit`}>
              <Pencil />
              编辑需求
            </Link>
          </Button>
        ) : null}
        {status === "OPEN" ? (
          <Button
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={() => run(pauseNeed, "已暂停需求")}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Pause />}
            暂停应征
          </Button>
        ) : null}
        {status === "PAUSED" ? (
          <Button
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={() => run(resumeNeed, "已恢复需求")}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            恢复应征
          </Button>
        ) : null}
        {status !== "CLOSED" ? (
          <Button
            variant="danger"
            disabled={pending}
            className="w-full"
            onClick={() =>
              run(
                closeNeed,
                "已关闭需求",
                "确定要关闭该需求吗?未选中的应征将被标记为未选中。"
              )
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <XCircle />}
            关闭需求
          </Button>
        ) : null}
        {status === "CLOSED" ? (
          <p className="rounded-md bg-accent/60 px-3 py-2 text-sm text-muted-foreground">
            该需求已关闭,不再接受应征;已完成的对接记录仍可在上方查看。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ───────────────────────── 发布者侧总卡 ─────────────────────────

function RequesterActions({
  needId,
  status,
  applicants,
  matches,
}: {
  needId: string;
  status: "OPEN" | "PAUSED" | "CLOSED";
  applicants: ApplicantSummary[];
  matches: MatchedSummary[];
}) {
  return (
    <div className="space-y-4">
      <RequesterApplicants applicants={applicants} matches={matches} />
      <RequesterLifecycle needId={needId} status={status} />
    </div>
  );
}

// ───────────────────────── 提供者侧:应征 ─────────────────────────

function ProviderActions({
  needId,
  contact,
  status,
  viewerApplied,
  matches,
}: {
  needId: string;
  contact: string | null;
  status: "OPEN" | "PAUSED" | "CLOSED";
  viewerApplied: boolean;
  matches: MatchedSummary[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("请填写应征留言(必填)");
      return;
    }
    startTransition(async () => {
      const res = await applyToNeed(needId, trimmed);
      if (res.ok) {
        toast.success("应征已提交");
        setOpen(false);
        setMessage("");
      } else {
        toast.error(res.error);
      }
    });
  }

  const canApply = status === "OPEN" && !viewerApplied && matches.length === 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* 若涉及我的撮合正在进行,优先展示撮合状态。 */}
        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((m) => (
              <MatchStatusRow key={m.matchId} match={m} />
            ))}
            <Separator />
          </div>
        ) : null}

        <div>
          {canApply ? (
            <Button
              className="w-full active:scale-[0.98]"
              onClick={() => setOpen(true)}
            >
              <HandHeart />
              我可以帮忙
            </Button>
          ) : viewerApplied ? (
            <Button disabled className="w-full">
              <CheckCircle2 />
              已应征
            </Button>
          ) : (
            <Button disabled className="w-full">
              <HandHeart />
              暂不可应征
            </Button>
          )}
          {!canApply && status !== "OPEN" ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              该需求当前状态为{status === "PAUSED" ? "已暂停" : "已关闭"}。
            </p>
          ) : null}
        </div>

        <Separator />

        <ContactBlock contact={contact} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>应征该需求</DialogTitle>
              <DialogDescription>
                告诉需求方你能如何帮助、相关经验与时间安排。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                应征留言
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="说明你能提供的帮助(必填)"
                rows={4}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                提交应征
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ───────────────────────── 游客/未认证 ─────────────────────────

function GuestActions({
  hasSession,
  contact,
}: {
  hasSession: boolean;
  contact: string | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block w-full">
              <Button disabled className="w-full">
                <HandHeart />
                我可以帮忙
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {hasSession ? "完成认证后即可应征" : "登录后即可应征"}
          </TooltipContent>
        </Tooltip>

        <Separator />

        <ContactBlock contact={contact} />

        <Button asChild variant="outline" className="w-full">
          <Link href={hasSession ? "/settings" : "/login"}>
            {hasSession ? "去认证" : "去登录"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ───────────────────────── 入口 ─────────────────────────

export function NeedDetailActions({
  needId,
  status,
  isRequester,
  viewerVerified,
  contact,
  applicants,
  matches,
  viewerApplied,
}: NeedDetailActionsProps) {
  if (isRequester) {
    return (
      <RequesterActions
        needId={needId}
        status={status}
        applicants={applicants}
        matches={matches}
      />
    );
  }

  if (viewerVerified !== null) {
    return (
      <ProviderActions
        needId={needId}
        contact={contact}
        status={status}
        viewerApplied={viewerApplied}
        matches={matches}
      />
    );
  }

  return <GuestActions hasSession={viewerVerified !== null} contact={contact} />;
}
