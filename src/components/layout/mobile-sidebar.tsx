"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { SessionUser } from "@/components/layout/user-menu";

/**
 * Mobile-only trigger (lg:hidden) that opens the AppSidebar inside a Sheet.
 */
export function MobileSidebar({ user }: { user?: SessionUser | null }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="打开菜单"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-outline-variant/40">
          <SheetTitle className="font-serif">校园枢纽 UniSwap</SheetTitle>
        </SheetHeader>
        <AppSidebar user={user} className="w-full border-r-0 bg-transparent" />
      </SheetContent>
    </Sheet>
  );
}
