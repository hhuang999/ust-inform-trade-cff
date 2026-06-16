"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { X, ShieldCheck, Clock, FileImage } from "lucide-react";

import { cn } from "@/lib/utils";
import { reviewAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

export interface ReviewRequestProps {
  id: string;
  submittedAt: Date;
  photoKeys: string[];
  user: {
    nickname: string;
    realName: string;
    studentId: string;
    department: string;
    enrollmentYear: number;
    email: string | null;
    phone: string | null;
    avatarKey: string | null;
  };
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // CJK: take last 1-2 chars; latin: take first letters of words.
  if (/[一-鿿]/.test(trimmed)) {
    return trimmed.slice(-2);
  }
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function SubmittingButton({
  variant,
  value,
  children,
  className,
}: {
  variant: "success" | "danger";
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="decision"
      value={value}
      variant={variant}
      disabled={pending}
      className={className}
    >
      {children}
    </Button>
  );
}

/** The reject flow: opens a Dialog to collect a required reason, then submits. */
function RejectDialog({ requestId, applicantName }: { requestId: string; applicantName: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | undefined>(undefined);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // reset on close
      setReason("");
      setError(undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="danger">
          <X />
          拒绝
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl border-outline-variant/40 bg-card shadow-card">
        <DialogHeader>
          <DialogTitle className="font-serif">拒绝认证申请</DialogTitle>
          <DialogDescription>
            请填写拒绝理由,将通知给 {applicantName}。
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            const r = (formData.get("reason") as string | null)?.trim() ?? "";
            if (!r) {
              setError("请填写拒绝理由");
              return;
            }
            try {
              await reviewAction(formData);
              toast.success("已拒绝该申请");
              handleOpenChange(false);
            } catch {
              toast.error("操作失败,请重试");
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="requestId" value={requestId} />
          <Field
            label="拒绝理由"
            htmlFor={`reject-reason-${requestId}`}
            error={error}
          >
            <Input
              id={`reject-reason-${requestId}`}
              name="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="例如:学生证照片不清晰"
              aria-invalid={error ? true : undefined}
              autoFocus
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <SubmittingButton variant="danger" value="REJECTED">
              确认拒绝
            </SubmittingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewCard({ request }: { request: ReviewRequestProps }) {
  const { user, photoKeys, submittedAt } = request;
  const displayName = user.nickname || user.realName || user.studentId;
  const contact = user.email ?? user.phone ?? "—";
  const submitLabel = new Date(submittedAt).toLocaleString("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <Card
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        "gap-5"
      )}
    >
      <CardContent className="space-y-5">
        {/* Applicant header */}
        <div className="flex items-start gap-4">
          <Avatar className="size-11 border border-outline-variant/40">
            <AvatarFallback className="bg-pending-soft text-pending font-serif text-sm">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-serif text-base font-semibold leading-none">
                {displayName}
              </span>
              <Badge status="PENDING" />
            </div>
            <div className="text-sm text-muted-foreground">
              {user.department}
              <span className="text-muted-foreground/50"> · </span>
              学号 {user.studentId}
              <span className="text-muted-foreground/50"> · </span>
              {user.enrollmentYear} 级
            </div>
            <div className="text-xs text-muted-foreground/80">{contact}</div>
          </div>
          <div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Clock className="size-3.5" />
            {submitLabel}
          </div>
        </div>

        {/* Student-id thumbnails */}
        {photoKeys.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoKeys.map((k) => (
              <a
                key={k}
                href={`/api/admin/student-id?key=${encodeURIComponent(k)}`}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-lg border border-outline-variant/40 shadow-sm transition-shadow hover:shadow-card"
              >
                <img
                  src={`/api/admin/student-id?key=${encodeURIComponent(k)}`}
                  alt={`${displayName} 的学生证`}
                  className="aspect-[4/3] w-full rounded-lg border border-outline-variant/40 object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant/40 bg-background/50 px-4 py-6 text-sm text-muted-foreground">
            <FileImage className="size-4" />
            该申请未上传学生证照片
          </div>
        )}

        {/* Review actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-4">
          <form action={reviewAction} className="contents">
            <input type="hidden" name="requestId" value={request.id} />
            <SubmittingButton variant="success" value="APPROVED">
              <ShieldCheck />
              通过
            </SubmittingButton>
          </form>
          <RejectDialog requestId={request.id} applicantName={displayName} />
        </div>
      </CardContent>
    </Card>
  );
}
