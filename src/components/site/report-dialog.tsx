"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

import type { ReportReason, ReportTargetType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";

import { REPORT_REASONS, REPORT_DESCRIPTION_MAX } from "@/lib/constants/report";
import { createReport } from "@/app/(app)/reports/actions";

export interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  /** 自定义触发器;默认为带 Flag 图标的 ghost 按钮。 */
  trigger?: React.ReactNode;
}

/**
 * 举报对话框(客户端)。
 * - 必选一个举报理由,可选补充说明(≤500 字 + 计数)。
 * - 提交经 useTransition 调用 createReport 服务端 action。
 * - 鉴权由服务端 action 负责,客户端无需 auth 数据。
 */
export function ReportDialog({
  targetType,
  targetId,
  trigger,
}: ReportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<ReportReason | null>(null);
  const [description, setDescription] = React.useState("");
  const [pending, startTransition] = useTransition();

  // 关闭时重置内部状态。
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason(null);
      setDescription("");
    }
  }

  function handleSubmit() {
    if (!reason) return;
    startTransition(async () => {
      const res = await createReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });
      if (res.ok) {
        toast.success("举报已提交,我们会尽快处理");
        handleOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  const remaining = REPORT_DESCRIPTION_MAX - description.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Flag className="text-muted-foreground" />
            举报
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">举报</DialogTitle>
          <DialogDescription>
            请选择举报理由,我们会尽快核实并处理。恶意举报可能影响你的账号信用。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>举报理由</Label>
          <RadioGroup
            value={reason ?? undefined}
            onValueChange={(v) => setReason(v as ReportReason)}
          >
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-outline-variant/40 bg-card px-3.5 py-2.5 text-sm transition-colors hover:bg-accent/60 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary-container/40"
              >
                <RadioGroupItem value={r.value} id={`report-reason-${r.value}`} />
                <span className="text-foreground">{r.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="report-description">补充说明(选填)</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {remaining}
            </span>
          </div>
          <Textarea
            id="report-description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, REPORT_DESCRIPTION_MAX))
            }
            maxLength={REPORT_DESCRIPTION_MAX}
            rows={4}
            placeholder="可补充相关情况,帮助我们更快判断(最多 500 字)"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !reason}>
            {pending ? <Loader2 className="animate-spin" /> : <Flag />}
            提交举报
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
