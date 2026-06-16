"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { type BookingStatus } from "@prisma/client";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
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
import { Separator } from "@/components/ui/separator";
import { Textarea, Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  addServiceSlot,
  closeService,
  confirmBooking,
  confirmBookingComplete,
  createBooking,
  decideBookingLiability,
  pauseService,
  rejectBooking,
  removeServiceSlot,
  requestCancelBooking,
  resumeService,
} from "@/app/(app)/services/actions";

// ───────────────────────── 共享类型(可序列化) ─────────────────────────

export interface SlotSummary {
  id: string;
  startAt: string;
  endAt: string;
}

export interface PendingBooking {
  id: string;
  clientId: string;
  clientNickname: string;
  note: string;
  slotId: string | null;
  slotStart: string;
  slotEnd: string;
}

export interface ActiveBooking {
  id: string;
  clientId: string;
  clientNickname: string;
  status: BookingStatus;
  isViewerFirstConfirmer: boolean;
  isCanceller: boolean;
  slotStart: string;
  slotEnd: string;
}

export interface ServiceDetailActionsProps {
  serviceId: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  isProvider: boolean;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
  viewerId: string | null;
  contact: string | null;
  pendingBookings: PendingBooking[];
  activeBookings: ActiveBooking[];
  slots: SlotSummary[];
  availableSlots: SlotSummary[];
}

function formatLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const BOOKING_STATUS_LABEL: Record<ActiveBooking["status"], string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CANCELLING: "取消协商中",
  COMPLETED: "已完成",
  REJECTED: "已拒绝",
  CANCELLED: "已取消",
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

// ───────────────────────── 进行中预约状态行(双方共用) ─────────────────────────

function BookingStatusRow({ booking }: { booking: ActiveBooking }) {
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const res = await confirmBookingComplete(booking.id);
      if (res.ok) {
        toast.success(res.completed ? "服务已完成" : "已确认,等待对方确认");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await requestCancelBooking(booking.id);
      if (res.ok) {
        toast.success("已发起取消请求");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDecide(agree: boolean) {
    startTransition(async () => {
      const res = await decideBookingLiability(booking.id, agree);
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
        当前预约 · {BOOKING_STATUS_LABEL[booking.status]}
      </p>
      <p className="mb-1 text-sm text-foreground">
        对方：<span className="font-medium">{booking.clientNickname}</span>
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        {formatLocal(booking.slotStart)} – {formatLocal(booking.slotEnd)}
      </p>

      {booking.status === "CONFIRMED" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={handleComplete}
            disabled={pending || booking.isViewerFirstConfirmer}
          >
            <CheckCircle2 />
            {booking.isViewerFirstConfirmer ? "你已确认" : "确认完成"}
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

      {booking.status === "CANCELLING" ? (
        booking.isCanceller ? (
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

// ───────────────────────── 提供者侧:待确认预约列表 ─────────────────────────

function ProviderPendingList({
  pendingBookings,
}: {
  pendingBookings: PendingBooking[];
}) {
  const [pendingId, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  function handleConfirm(bookingId: string) {
    startTransition(async () => {
      const res = await confirmBooking(bookingId);
      if (res.ok) {
        toast.success("已确认接单");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleReject(bookingId: string) {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("请填写拒绝原因");
      return;
    }
    startTransition(async () => {
      const res = await rejectBooking(bookingId, trimmed);
      if (res.ok) {
        toast.success("已拒绝预约");
        setRejectingId(null);
        setReason("");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (pendingBookings.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        暂无待确认预约
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {pendingBookings.map((b) => (
        <li
          key={b.id}
          className="rounded-lg border border-outline-variant/40 bg-card p-2.5"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">
              {b.clientNickname}
            </span>
            <Badge variant="secondary" className="font-normal">
              待确认
            </Badge>
          </div>
          <p className="mb-1 text-xs text-muted-foreground">
            {formatLocal(b.slotStart)} – {formatLocal(b.slotEnd)}
          </p>
          {b.note ? (
            <p className="mb-2 rounded-md bg-accent/60 px-2 py-1.5 text-xs text-foreground/80">
              {b.note}
            </p>
          ) : null}

          {rejectingId === b.id ? (
            <div className="space-y-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请填写拒绝原因(必填)"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleReject(b.id)}
                  disabled={pendingId !== null}
                >
                  提交拒绝
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectingId(null);
                    setReason("");
                  }}
                  disabled={pendingId !== null}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => handleConfirm(b.id)}
                disabled={pendingId !== null}
              >
                <CheckCircle2 />
                确认接单
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectingId(b.id)}
                disabled={pendingId !== null}
              >
                <XCircle />
                拒绝
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── 提供者侧:时段管理(折叠) ─────────────────────────

function SlotManager({
  serviceId,
  slots,
}: {
  serviceId: string;
  slots: SlotSummary[];
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  function handleAdd() {
    if (!start || !end) {
      toast.error("请填写开始与结束时间");
      return;
    }
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();
    if (Number.isNaN(Date.parse(startIso)) || Number.isNaN(Date.parse(endIso))) {
      toast.error("时间格式不正确");
      return;
    }
    if (Date.parse(endIso) <= Date.parse(startIso)) {
      toast.error("结束时间须晚于开始时间");
      return;
    }
    startTransition(async () => {
      const res = await addServiceSlot(serviceId, startIso, endIso);
      if (res.ok) {
        toast.success("已添加时段");
        setStart("");
        setEnd("");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleRemove(slotId: string) {
    if (typeof window !== "undefined") {
      if (!window.confirm("确定移除该时段?")) return;
    }
    startTransition(async () => {
      const res = await removeServiceSlot(serviceId, slotId);
      if (res.ok) {
        toast.success("已移除时段");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarPlus className="size-4 text-primary" />
          时段管理
          <Badge variant="secondary" className="font-normal">
            {slots.length}
          </Badge>
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {open ? "收起" : "展开"}
        </span>
      </button>

      {open ? (
        <CardContent className="space-y-4 pt-0">
          <Separator />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">开始</span>
                <Input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">结束</span>
                <Input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={pending}
              className="w-full"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
              添加时段
            </Button>
          </div>

          {slots.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">
              暂无时段
            </p>
          ) : (
            <ul className="space-y-1.5">
              {slots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/40 bg-card px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">
                    {formatLocal(s.startAt)} – {formatLocal(s.endAt)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => handleRemove(s.id)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}

// ───────────────────────── 提供者侧:生命周期按钮 ─────────────────────────

function ProviderLifecycle({
  serviceId,
  status,
}: {
  serviceId: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
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
      const res = await fn(serviceId);
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
        {status === "ACTIVE" ? (
          <Button
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={() => run(pauseService, "已暂停服务")}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Pause />}
            暂停接单
          </Button>
        ) : null}
        {status === "PAUSED" ? (
          <Button
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={() => run(resumeService, "已恢复接单")}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            恢复接单
          </Button>
        ) : null}
        {status !== "CLOSED" ? (
          <Button
            variant="danger"
            disabled={pending}
            className="w-full"
            onClick={() =>
              run(
                closeService,
                "已关闭服务",
                "确定要关闭该服务吗?关闭后不可恢复。"
              )
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <XCircle />}
            关闭服务
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ───────────────────────── 提供者侧总卡 ─────────────────────────

function ProviderActions({
  serviceId,
  status,
  pendingBookings,
  activeBookings,
  slots,
}: {
  serviceId: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  pendingBookings: PendingBooking[];
  activeBookings: ActiveBooking[];
  slots: SlotSummary[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            待确认预约
            <Badge variant="secondary" className="font-normal">
              {pendingBookings.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProviderPendingList pendingBookings={pendingBookings} />
          {activeBookings.length > 0 ? (
            <div className="space-y-3">
              <Separator />
              {activeBookings.map((b) => (
                <BookingStatusRow key={b.id} booking={b} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SlotManager serviceId={serviceId} slots={slots} />
      <ProviderLifecycle serviceId={serviceId} status={status} />
    </div>
  );
}

// ───────────────────────── 客户侧:预约 ─────────────────────────

function ClientActions({
  serviceId,
  contact,
  availableSlots,
  status,
}: {
  serviceId: string;
  contact: string | null;
  availableSlots: SlotSummary[];
  status: "ACTIVE" | "PAUSED" | "CLOSED";
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotSummary | null>(
    null
  );
  const [note, setNote] = React.useState("");

  function openWith(slot: SlotSummary) {
    setSelectedSlot(slot);
    setNote("");
    setOpen(true);
  }

  function handleSubmit() {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("请填写预约备注(必填)");
      return;
    }
    if (!selectedSlot) return;
    const slotStart = selectedSlot.startAt;
    const slotEnd = selectedSlot.endAt;
    startTransition(async () => {
      const res = await createBooking(serviceId, {
        slotId: selectedSlot.id,
        slotStart,
        slotEnd,
        note: trimmed,
      });
      if (res.ok) {
        toast.success("预约已提交,等待确认");
        setOpen(false);
        setSelectedSlot(null);
        setNote("");
      } else {
        toast.error(res.error);
      }
    });
  }

  const bookable = status === "ACTIVE";

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">选择可预约时段</p>
            {bookable ? null : (
              <Badge variant="secondary" className="font-normal">
                暂不可预约
              </Badge>
            )}
          </div>
          {!bookable ? (
            <p className="text-xs text-muted-foreground">
              该服务当前状态为{status === "PAUSED" ? "已暂停" : "已关闭"},暂不接受预约。
            </p>
          ) : availableSlots.length === 0 ? (
            <p className="rounded-md bg-accent/60 px-3 py-2 text-xs text-muted-foreground">
              暂无可预约时段
            </p>
          ) : (
            <ul className="space-y-1.5">
              {availableSlots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/40 bg-card px-2.5 py-2 text-xs"
                >
                  <span className="truncate">
                    {formatLocal(s.startAt)} – {formatLocal(s.endAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => openWith(s)}
                  >
                    预约
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <ContactBlock contact={contact} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>预约该时段</DialogTitle>
              <DialogDescription>
                {selectedSlot
                  ? `${formatLocal(selectedSlot.startAt)} – ${formatLocal(
                      selectedSlot.endAt
                    )}`
                  : null}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                预约备注
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="说明你的需求或问题(必填)"
                rows={4}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                提交预约
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
                <CalendarPlus />
                预约
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {hasSession ? "完成认证后即可预约" : "登录后即可预约"}
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

export function ServiceDetailActions({
  serviceId,
  status,
  isProvider,
  viewerVerified,
  contact,
  pendingBookings,
  activeBookings,
  slots,
  availableSlots,
}: ServiceDetailActionsProps) {
  if (isProvider) {
    return (
      <ProviderActions
        serviceId={serviceId}
        status={status}
        pendingBookings={pendingBookings}
        activeBookings={activeBookings}
        slots={slots}
      />
    );
  }

  if (viewerVerified === true) {
    return (
      <ClientActions
        serviceId={serviceId}
        contact={contact}
        availableSlots={availableSlots}
        status={status}
      />
    );
  }

  return (
    <GuestActions
      hasSession={viewerVerified !== null}
      contact={contact}
    />
  );
}
