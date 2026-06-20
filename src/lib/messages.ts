/**
 * 站内私信(沟通留言)的共享逻辑:被详情页(读会话)与 server action(发消息)共用。
 *
 * 设计:私信挂在具体交易上下文(物品/服务/需求)上,仅"交易关系方"之间可见。
 * 交易关系 = 双方中一方是物主/提供者/发布者,且另一方对应存在
 *   意向(ItemInterest)/ 交易(ItemDeal)/ 预约(Booking)/ 应征(NeedMatch)。
 * 这正是把原本"一次性的"意向/预约/应征留言升级为多轮沟通的入口关系——
 * 买家先"我想要"、客户先预约、提供者先应征,建立关系后即可多轮私信。
 */

import { prisma } from "@/lib/db";

export type MessageContextType = "ITEM" | "SERVICE" | "NEED";

// 留言长度上限:见 @/lib/constants/message(客户端也可安全引用)。
export { MESSAGE_BODY_MAX } from "@/lib/constants/message";

/** 详情页传入客户端组件的单条消息(可序列化)。 */
export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string; // ISO
}

/** 详情页需要的会话数据(可序列化,下发给客户端组件)。 */
export interface MessageThreadData {
  contextType: MessageContextType;
  contextId: string;
  otherUserId: string;
  otherNickname: string;
  messages: ThreadMessage[];
}

/** 详情页路径(发消息后 revalidate / 通知 link 用)。 */
export function contextDetailPath(
  contextType: MessageContextType,
  contextId: string
): string {
  if (contextType === "ITEM") return `/items/${contextId}`;
  if (contextType === "SERVICE") return `/services/${contextId}`;
  return `/needs/${contextId}`;
}

/**
 * 校验 a 与 b 在该交易上下文上是否存在"交易关系"(私信前置条件,防骚扰/防伪造收件人)。
 * 任一方须为物主/提供者/发布者,且另一方存在对应的意向/交易/预约/应征(且未被废弃)。
 */
export async function hasMessageRelationship(
  contextType: MessageContextType,
  contextId: string,
  aId: string,
  bId: string
): Promise<boolean> {
  if (!aId || !bId || aId === bId) return false;

  if (contextType === "ITEM") {
    const item = await prisma.item.findUnique({
      where: { id: contextId },
      select: { sellerId: true, deletedAt: true },
    });
    if (!item || item.deletedAt) return false;
    // 一方须为卖家;另一方须有意向或进行中/已完成交易。
    const otherId =
      item.sellerId === aId ? bId : item.sellerId === bId ? aId : null;
    if (!otherId) return false; // 两人都不是卖家 → 无关系
    const [interest, deal] = await Promise.all([
      prisma.itemInterest.findUnique({
        where: { itemId_userId: { itemId: contextId, userId: otherId } },
        select: { id: true },
      }),
      prisma.itemDeal.findFirst({
        where: {
          itemId: contextId,
          buyerId: otherId,
          status: { in: ["PENDING", "COMPLETED"] },
        },
        select: { id: true },
      }),
    ]);
    return !!(interest || deal);
  }

  if (contextType === "SERVICE") {
    const service = await prisma.service.findUnique({
      where: { id: contextId },
      select: { providerId: true },
    });
    if (!service) return false;
    // 一方须为提供者,另一方须为存在有效预约的客户。
    const clientId =
      service.providerId === aId ? bId : service.providerId === bId ? aId : null;
    if (!clientId) return false;
    const booking = await prisma.booking.findFirst({
      where: {
        serviceId: contextId,
        clientId,
        status: { in: ["PENDING", "CONFIRMED", "CANCELLING", "COMPLETED"] },
      },
      select: { id: true },
    });
    return !!booking;
  }

  // NEED
  const need = await prisma.need.findUnique({
    where: { id: contextId },
    select: { requesterId: true, deletedAt: true },
  });
  if (!need || need.deletedAt) return false;
  // 一方须为发布者,另一方须为应征过(且未被淘汰/取消)的提供者。
  const providerId =
    need.requesterId === aId ? bId : need.requesterId === bId ? aId : null;
  if (!providerId) return false;
  const match = await prisma.needMatch.findUnique({
    where: { needId_providerId: { needId: contextId, providerId } },
    select: { id: true, status: true },
  });
  return (
    !!match && match.status !== "NOT_SELECTED" && match.status !== "CANCELLED"
  );
}

/** 上下文是否存在且未删除(发消息前置校验,防对已删除内容发信)。 */
export async function contextExists(
  contextType: MessageContextType,
  contextId: string
): Promise<boolean> {
  if (contextType === "ITEM") {
    const it = await prisma.item.findUnique({
      where: { id: contextId },
      select: { deletedAt: true },
    });
    return !!it && !it.deletedAt;
  }
  if (contextType === "SERVICE") {
    const s = await prisma.service.findUnique({
      where: { id: contextId },
      select: { id: true },
    });
    return !!s;
  }
  const n = await prisma.need.findUnique({
    where: { id: contextId },
    select: { deletedAt: true },
  });
  return !!n && !n.deletedAt;
}

/**
 * 为详情页加载当前用户与 otherUserId 在该上下文上的会话。
 * 校验交易关系通过后才返回;否则返回 null(调用方据此隐藏"沟通留言"区)。
 */
export async function loadMessageThread(
  contextType: MessageContextType,
  contextId: string,
  viewerId: string | null,
  otherUserId: string | null
): Promise<MessageThreadData | null> {
  if (!viewerId || !otherUserId) return null;
  const related = await hasMessageRelationship(
    contextType,
    contextId,
    viewerId,
    otherUserId
  );
  if (!related) return null;

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { nickname: true },
  });
  if (!other) return null;

  // 取最近 200 条:先按时间倒序取最新 200,再在内存反转成升序展示。
  // 若直接 asc + take 200,会保留最旧的 200 条而丢掉新消息(长会话下看不到新留言)。
  // id 作为次序键,避免同一毫秒内的两条消息顺序不确定。
  const rows = await prisma.message.findMany({
    where: {
      contextType,
      contextId,
      OR: [
        { senderId: viewerId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: viewerId },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  const ordered = rows.slice().reverse();

  return {
    contextType,
    contextId,
    otherUserId,
    otherNickname: other.nickname,
    messages: ordered.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
