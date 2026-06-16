import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { NotificationBell } from "./notification-bell";

export async function Nav() {
  const session = await auth();
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-fg shadow-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5l9-4.5 9 4.5M4.5 9.75v8.25a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V9.75" />
            </svg>
          </span>
          校园信息流转平台
        </Link>
        <div className="flex items-center gap-1.5">
          {session?.user ? (
            <>
              <Link
                href={`/profile/${session.user.id}`}
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                我的主页
              </Link>
              <Link
                href="/settings"
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                设置
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin/verify"
                  className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  审核
                </Link>
              )}
              <div className="mx-1">
                <NotificationBell />
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="inline-flex h-8 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-brand-fg shadow-sm transition-colors hover:bg-brand-strong"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
