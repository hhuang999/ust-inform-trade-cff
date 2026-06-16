"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/user";

export type RegisterState = { error?: string };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    password: formData.get("password"),
    realName: formData.get("realName"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
    enrollmentYear: Number(formData.get("enrollmentYear")),
    nickname: formData.get("nickname"),
    realNameVisible: formData.get("realNameVisible") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法" };
  }
  const d = parsed.data;

  // 唯一性检查 —— 只对「实际填写」的标识符查重 (避免 email:null 误匹配 IS NULL)
  const orClauses: Record<string, string>[] = [];
  if (d.email) orClauses.push({ email: d.email.toLowerCase() });
  if (d.phone) orClauses.push({ phone: d.phone });
  const existing = orClauses.length
    ? await prisma.user.findFirst({ where: { OR: orClauses } })
    : null;
  if (existing) return { error: "该邮箱或手机号已注册" };

  const user = await prisma.user.create({
    data: {
      email: d.email ? d.email.toLowerCase() : null,
      phone: d.phone ?? null,
      passwordHash: await hashPassword(d.password),
      realName: d.realName,
      studentId: d.studentId,
      department: d.department,
      enrollmentYear: d.enrollmentYear,
      nickname: d.nickname,
      realNameVisible: d.realNameVisible,
    },
    select: { id: true },
  });

  await signIn("credentials", {
    identifier: (d.email ?? d.phone) as string,
    password: d.password,
    redirect: false,
  });
  redirect(`/profile/${user.id}`);
}
