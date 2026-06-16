export function avatarKey(userId: string, rand: string): string {
  return `public/avatars/${userId}/${rand}`;
}

export function studentIdKey(requestId: string, rand: string): string {
  return `private/student-ids/${requestId}/${rand}`;
}
