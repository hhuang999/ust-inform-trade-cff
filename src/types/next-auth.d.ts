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
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    verificationStatus?: VerificationStatus;
  }
}
