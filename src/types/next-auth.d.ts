import type { DefaultSession } from "next-auth";
import type { Role, VerificationStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      verificationStatus: VerificationStatus;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role?: Role;
    verificationStatus?: VerificationStatus;
    disabled?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    verificationStatus?: VerificationStatus;
    disabled?: boolean;
    /** 上次从 DB 重新拉取角色/认证/封禁态的时间戳(节流用)。 */
    refreshedAt?: number;
  }
}
