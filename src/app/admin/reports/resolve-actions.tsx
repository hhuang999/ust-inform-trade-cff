"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { resolveReport, type ResolveAction } from "./actions";

const OPTIONS: { value: ResolveAction; label: string }[] = [
  { value: "NONE", label: "无违规" },
  { value: "WARNING", label: "警告" },
  { value: "TAKEDOWN", label: "强制下架" },
  { value: "BAN", label: "封禁" },
];

export function ResolveActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = React.useState<ResolveAction>("NONE");

  function handleSubmit() {
    startTransition(async () => {
      const res = await resolveReport(reportId, action);
      if (res.ok) {
        toast.success("已处理该举报");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={action}
        onValueChange={(v) => setAction(v as ResolveAction)}
        disabled={pending}
      >
        <SelectTrigger className="h-9 w-40 bg-card" aria-label="选择处理操作">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSubmit} disabled={pending} size="sm">
        {pending ? <Loader2 className="animate-spin" /> : <Gavel />}
        提交
      </Button>
    </div>
  );
}
