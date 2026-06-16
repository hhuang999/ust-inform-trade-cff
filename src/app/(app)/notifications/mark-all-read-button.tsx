"use client";

import { useTransition } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "./actions";

/** 通知列表「全部标为已读」按钮:客户端岛屿,useTransition + toast 反馈。 */
export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleMarkAll() {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res?.ok) {
        toast.success("已全部标为已读");
      } else if (res?.error) {
        toast.error(res.error);
      } else {
        toast.error("操作失败,请重试");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleMarkAll}
      disabled={disabled || isPending}
      className="active:scale-[0.98]"
    >
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <CheckCheck />
      )}
      全部标为已读
    </Button>
  );
}
