/**
 * 通知点击跳转:从一条通知推断点击后应跳转的站内路径。
 *
 * 通知表有 `link` 字段,但并非所有写入点都填了它;几乎所有通知都把目标
 * 实体 ID 放进了 `data` JSON。这里优先用 `link`,缺省时按 `data` 里的
 * ID(交易/预约/撮合/物品/服务/需求)推断,从而让历史通知也能点击跳转。
 */

type NotificationLike = {
  type?: string;
  link?: string | null;
  data?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * 返回点击该通知应跳转的路径;无法推断时返回 null(调用方按纯文本渲染)。
 */
export function notificationHref(n: NotificationLike): string | null {
  // 1) 显式 link 优先(如 needs 模块已写入 link)。
  const explicit = asString(n.link);
  if (explicit) return explicit;

  // 2) 从 data JSON 推断。
  if (!n.data || typeof n.data !== "object" || Array.isArray(n.data)) return null;
  const d = n.data as Record<string, unknown>;

  const matchId = asString(d.matchId);
  const bookingId = asString(d.bookingId);
  const dealId = asString(d.dealId);
  const dealType = asString(d.dealType);
  const itemId = asString(d.itemId);
  const serviceId = asString(d.serviceId);
  const needId = asString(d.needId);

  // 需要操作的通知优先指向「管理/处理」页(撮合/预约/交易列表)。
  if (matchId) return "/me/matches";
  if (bookingId) return "/me/bookings";
  if (dealId) {
    if (dealType === "BOOKING") return "/me/bookings";
    if (dealType === "NEED_MATCH") return "/me/matches";
    return "/me/items"; // ITEM 交易(默认)
  }
  // 否则指向实体详情页。
  if (itemId) return `/items/${itemId}`;
  if (serviceId) return `/services/${serviceId}`;
  if (needId) return `/needs/${needId}`;

  return null;
}
