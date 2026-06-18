import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { withBasePath } from "@/lib/base-path";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  const isProtectedUser = path.startsWith("/settings") || path.startsWith("/profile");
  const isAdminArea = path.startsWith("/admin");

  if (isAdminArea && !isAdmin) {
    // 子路径部署(basePath)下,重定向须手动带前缀,否则落到平台根 404/跳出应用。
    return Response.redirect(
      new URL(withBasePath(isLoggedIn ? "/" : "/login"), req.nextUrl)
    );
  }
  if (isProtectedUser && !isLoggedIn) {
    const url = new URL(withBasePath("/login"), req.nextUrl);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|.*\\..*).*)"],
};
