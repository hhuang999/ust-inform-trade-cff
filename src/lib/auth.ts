import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role, VerificationStatus } from "@prisma/client";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

/** 在线用户角色/认证/封禁态的重新拉取节流间隔(避免每请求一次 Neon 查询)。 */
const ROLE_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { identifier: {}, password: {} },
      async authorize(raw) {
        const identifier = String(raw?.identifier ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }],
            deletedAt: null,
          },
        });
        if (!user) return null;
        // 封禁账号禁止登录。
        if (user.disabled) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          role: user.role,
          verificationStatus: user.verificationStatus,
          disabled: user.disabled,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // 登录:写入初始字段 + 刷新时间戳。
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.verificationStatus = user.verificationStatus;
        token.disabled = user.disabled ?? false;
        token.refreshedAt = Date.now();
        return token;
      }
      // 周期性从 DB 重新拉取角色/认证态/封禁态(节流)。
      // 使「管理员通过认证 / 封禁 / 降级」在数分钟内对在线用户生效,
      // 而非等到其重新登录。
      const last = typeof token.refreshedAt === "number" ? token.refreshedAt : 0;
      const id = token.id;
      if (id && Date.now() - last > ROLE_REFRESH_INTERVAL_MS) {
        try {
          const u = await prisma.user.findUnique({
            where: { id },
            select: {
              role: true,
              verificationStatus: true,
              disabled: true,
              deletedAt: true,
            },
          });
          if (!u || u.deletedAt) {
            // 账号已删除 → 失效会话。
            token.disabled = true;
          } else {
            token.role = u.role;
            token.verificationStatus = u.verificationStatus;
            token.disabled = u.disabled;
          }
          token.refreshedAt = Date.now();
        } catch {
          // Neon 抖动等:沿用既有 token,并顺延节流避免每请求重试风暴。
          token.refreshedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.disabled) {
        // 已封禁/删除:返回无用户的会话(等同登出);下次登录也会被 authorize 拒绝。
        return { ...session, user: undefined } as unknown as Session;
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.verificationStatus = token.verificationStatus as VerificationStatus;
      }
      return session;
    },
  },
});
