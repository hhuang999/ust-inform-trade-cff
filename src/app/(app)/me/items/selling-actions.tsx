"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { relistItem, deleteItem } from "@/app/(app)/items/actions";

type SellingStatus = "AVAILABLE" | "PENDING" | "SOLD" | "CLOSED";

/**
 * 「我发布的」物品行动作:重新上架(CLOSED→AVAILABLE)+ 删除(软删除)。
 * AVAILABLE/PENDING 不在此渲染(分别走编辑/管理 与 交易中)。
 */
export function SellingItemActions({
  itemId,
  status,
}: {
  itemId: string;
  status: SellingStatus;
}) {
  const [pending, startTransition] = useTransition();

  function handleRelist() {
    startTransition(async () => {
      const res = await relistItem(itemId);
      if (res.ok) toast.success("已重新上架");
      else toast.error(res.error);
    });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("确定删除该物品?删除后将从所有列表移除。")
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteItem(itemId);
      if (res.ok) toast.success("已删除");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {status === "CLOSED" ? (
        <Button size="sm" variant="outline" onClick={handleRelist} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          重新上架
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={pending}
        className="text-muted-foreground hover:text-destructive"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        删除
      </Button>
    </div>
  );
}
