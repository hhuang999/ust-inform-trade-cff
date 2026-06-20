"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  href?: string | null;
};

export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetch(withBasePath("/api/notifications"))
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setUnread((d.items ?? []).filter((i: NotificationItem) => !i.read).length);
      });
  }, []);

  async function markRead(id: string) {
    // 已读项不再重复 PATCH 或扣减未读(否则点已读条目会让未读计数偏低)。
    const target = items.find((i) => i.id === id);
    if (!target || target.read) return;
    await fetch(withBasePath(`/api/notifications/${id}/read`), { method: "PATCH" });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    setUnread((u) => (u ? u - 1 : 0));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="通知"
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rejected px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-float">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              暂无通知
            </p>
          ) : null}
          {items.map((i) => {
            const cls = cn(
              "block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
              i.read
                ? "text-muted-foreground"
                : "bg-primary/5 font-medium text-foreground",
            );
            const inner = (
              <>
                {i.title}
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {i.body}
                </span>
              </>
            );
            // 有跳转目标的通知渲染为链接(点击即跳转并标记已读),否则保留为按钮。
            return i.href ? (
              <Link
                key={i.id}
                href={i.href}
                onClick={() => markRead(i.id)}
                className={cls}
              >
                {inner}
              </Link>
            ) : (
              <button key={i.id} onClick={() => markRead(i.id)} className={cls}>
                {inner}
              </button>
            );
          })}
          {items.length > 0 ? (
            <Link
              href="/notifications"
              className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-muted"
            >
              查看全部通知
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
