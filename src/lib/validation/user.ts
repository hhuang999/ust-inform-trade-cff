import { z } from "zod";

const emailOrPhone = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
}).refine((d) => Boolean(d.email || d.phone), {
  message: "邮箱与手机号至少填一项",
});

export const registerSchema = emailOrPhone.extend({
  password: z.string().min(6).max(72),
  realName: z.string().min(1).max(50),
  studentId: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  enrollmentYear: z.number().int().min(2000).max(2100),
  nickname: z.string().min(1).max(30),
  realNameVisible: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
