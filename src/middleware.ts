import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  const isProtectedUser = path.startsWith("/settings") || path.startsWith("/profile");
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
