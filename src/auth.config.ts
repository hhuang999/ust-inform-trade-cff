import type { NextAuthConfig } from "next-auth";
import type { Role, VerificationStatus } from "@prisma/client";

export const authConfig = {
  session: { strategy: "jwt" },
  // 校园沙箱/反向代理部署:平台以 gpunion.hkust-gz.edu.cn 等域名转发,
  // Auth.js v5 默认不信任非 localhost 的 Host 会抛 UntrustedHost。自托管需显式信任。
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
