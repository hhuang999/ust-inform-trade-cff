"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { resolveFeedback } from "./actions";

export function ResolveActions({ feedbackId }: { feedbackId: string }) {
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const res = await resolveFeedback(feedbackId, reply);
      if (res.ok) {
        toast.success("已回复并标记为已处理");
        setReply("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="回复反馈者(选填,将通过站内通知发送)"
        rows={2}
        maxLength={500}
      />
      <Button size="sm" onClick={handle} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        回复并标记已处理
      </Button>
    </div>
  );
}
