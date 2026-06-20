import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * /me/notifications → /notifications。
 * 通知页在顶层 /notifications;用户按「/me 下应有我的通知」的直觉访问时,
 * 这里重定向并透传 type 等查询参数。
 */
export default async function MeNotificationsAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v)) for (const x of v) qs.append(k, x);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/notifications${suffix}`);
}
