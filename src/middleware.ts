import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  // /profile 对所有人公开(含未登录访客):个人主页是公开名片,供从物品/服务卡片点入查看。
  // 仅 /settings 仍需登录。敏感字段(联系方式)由 contactVisibility 自行门控。
  const isProtectedUser = path.startsWith("/settings");
  const isAdminArea = path.startsWith("/admin");

  if (isAdminArea && !isAdmin) {
    return Response.redirect(new URL(isLoggedIn ? "/" : "/login", req.nextUrl));
  }
  if (isProtectedUser && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|.*\\..*).*)"],
};
