import type { NextAuthConfig } from "next-auth";
import type { Role, VerificationStatus } from "@prisma/client";

export const authConfig = {
  session: { strategy: "jwt" },
  // 自托管/反向代理部署:非 localhost 的 Host 默认不被 Auth.js v5 信任会抛 UntrustedHost。
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [], // Credentials provider is added in lib/auth.ts (middleware doesn't need it)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.verificationStatus = user.verificationStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.verificationStatus = token.verificationStatus as VerificationStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
