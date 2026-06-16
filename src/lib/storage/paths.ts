export function avatarKey(userId: string, rand: string): string {
  return `public/avatars/${userId}/${rand}`;
}

export function studentIdKey(requestId: string, rand: string): string {
  return `private/student-ids/${requestId}/${rand}`;
}

/**
 * 物品图片 key。发布时 itemId 尚未知,使用 sellerId 分桶,
 * 每张图携带随机后缀避免碰撞,统一落在公开桶下 public/items/...。
 */
export function itemImageKey(sellerId: string, rand: string): string {
  return `public/items/${sellerId}/${rand}`;
}
