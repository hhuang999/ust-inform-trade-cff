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
      <button onClick={() => setOpen((o) => !o)} className="relative">
        🔔
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white">{unread}</span> : null}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded border bg-white p-2 shadow">
          {items.length === 0 && <p className="text-sm text-gray-500">暂无通知</p>}
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => markRead(i.id)}
              className={`block w-full text-left p-2 text-sm ${i.read ? "text-gray-400" : "font-medium"}`}
            >
              {i.title}
              <span className="block text-xs text-gray-500">{i.body}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
