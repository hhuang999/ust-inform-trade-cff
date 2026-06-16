import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { NotificationBell } from "./notification-bell";

export async function Nav() {
  const session = await auth();
  return (
    <nav className="flex items-center justify-between border-b px-4 py-2">
      <Link href="/" className="font-semibold">校园信息流转平台</Link>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <Link href={`/profile/${session.user.id}`} className="text-sm">我的主页</Link>
            <Link href="/settings" className="text-sm">设置</Link>
            {session.user.role === "ADMIN" && <Link href="/admin/verify" className="text-sm">审核</Link>}
            <NotificationBell />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button className="text-sm">登出</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm">登录</Link>
            <Link href="/register" className="text-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
