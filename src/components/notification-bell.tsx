"use client";

import { useEffect, useState } from "react";

export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; title: string; body: string; read: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setItems(d.items ?? []);
      setUnread((d.items ?? []).filter((i: { read: boolean }) => !i.read).length);
    });
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    setUnread((u) => (u ? u - 1 : 0));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="通知"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rejected px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
            {unread}
          </span>
        ) : null}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">暂无通知</p>
          )}
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => markRead(i.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted ${
                i.read ? "text-muted-foreground" : "bg-brand/5 font-medium text-foreground"
              }`}
            >
              {i.title}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {i.body}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
