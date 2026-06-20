"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  type SessionUser,
} from "@/lib/permissions";
import {
  contextDetailPath,
  contextExists,
  hasMessageRelationship,
  type MessageContextType,
} from "@/lib/messages";
import { MESSAGE_BODY_MAX } from "@/lib/constants/message";

/**
 * 写入通知。直接落 notifications 表(而非 createNotification helper)以支持 `data` 字段
 * (helper 当前不接收 data;此处沿用各业务模块的本地 notify 写法)。
 */
function notify(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  data?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({ data: params });
}

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** 统一鉴权:将 requireVerifiedUser 的异常映射为可返回给客户端的错误对象。 */
async function resolveActor(): Promise<SessionUser | { error: string }> {
  const session = await auth();
  const user: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        verificationStatus: session.user.verificationStatus,
      }
    : null;
  try {
    return requireVerifiedUser(user);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return { error: "请先登录" };
    return { error: "请先登录" };
  }
}

export interface SendMessageInput {
  contextType: MessageContextType;
  contextId: string;
  recipientId: string;
  body: string;
}

/**
 * 发送一条站内私信。
 *
 * 安全:即便客户端可任意传 recipientId,服务端仍会
 *   1) 校验上下文存在且未删除;
 *   2) 校验发送者与 recipient 之间存在交易关系(hasMessageRelationship)。
 * 通过后才写入 Message,并向 recipient 发一条 type="message" 通知(点击回到该上下文
 * 的留言区并定位到与发送者的会话 ?with=<senderId>#messages)。
 */
export async function sendMessage(
  input: SendMessageInput
): Promise<ActionResult<{ messageId: string }>> {
  const actor = await resolveActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const body = (input.body ?? "").trim();
  if (!body) return { ok: false, error: "留言不能为空" };
  if (body.length > MESSAGE_BODY_MAX) {
    return { ok: false, error: `留言最多 ${MESSAGE_BODY_MAX} 字` };
  }
  if (!input.recipientId) return { ok: false, error: "缺少收件人" };
  if (input.recipientId === actor.id) {
    return { ok: false, error: "不能给自己发私信" };
  }

  // 上下文 + 交易关系双重校验(防对已删除内容、对无关用户发信)。
  const exists = await contextExists(input.contextType, input.contextId);
  if (!exists) return { ok: false, error: "该内容不存在或已删除" };
  const related = await hasMessageRelationship(
    input.contextType,
    input.contextId,
    actor.id,
    input.recipientId
  );
  if (!related) return { ok: false, error: "仅可与交易关系方私信" };

  const msg = await prisma.message.create({
    data: {
      contextType: input.contextType,
      contextId: input.contextId,
      senderId: actor.id,
      recipientId: input.recipientId,
      body,
    },
    select: { id: true },
  });

  // 送达:向 recipient 推一条通知,link 直达该上下文留言区并定位到与发送者的会话。
  const sender = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { nickname: true },
  });
  // 用 Array.from 按字符(而非 UTF-16 码元)截断,避免把 emoji 等代理对从中间切断。
  const chars = Array.from(body);
  const snippet = chars.length > 40 ? `${chars.slice(0, 40).join("")}…` : body;
  const base = contextDetailPath(input.contextType, input.contextId);
  await notify({
    userId: input.recipientId,
    type: "message",
    title: "你收到一条新私信",
    body: `${sender?.nickname ?? "有人"}：${snippet}`,
    link: `${base}?with=${actor.id}#messages`,
    data: {
      contextType: input.contextType,
      contextId: input.contextId,
      senderId: actor.id,
    },
  });

  // 让该上下文详情页(留言区)即时刷新(发送者侧)。
  revalidatePath(base);
  return { ok: true, messageId: msg.id };
}
