"use client";

import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Settings, ShieldCheck, User } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export type SessionUser = {
  id: string;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  role?: string | null;
};

/**
 * Client island for the signed-in user dropdown.
 * Receives the user as a prop (no auth()/prisma imported here).
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const [isPending, startTransition] = useTransition();

  const label = user.nickname || user.name || user.email || "我";
  const initial = (label?.[0] ?? "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="账户菜单"
          className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Avatar className="size-9 ring-1 ring-outline-variant/40 transition-shadow hover:shadow-sm">
            <AvatarFallback className="bg-primary-container font-serif text-sm font-semibold text-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 shadow-float">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.id}`}>
            <User className="size-4" />
            我的主页
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            设置
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/verify">
              <ShieldCheck className="size-4" />
              审核
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => {
              void signOut({ callbackUrl: "/" });
            });
          }}
        >
          <LogOut className="size-4" />
          {isPending ? "登出中…" : "登出"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
