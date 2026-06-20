import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 服务预约已整合进「服务预约」页(/me/services)的 tab。
 * 本路由保留为重定向,使历史通知链接与 revalidatePath 不致 404。
 * - tab=incoming(我接的预约)→ /me/services?tab=incoming
 * - tab=outgoing(我的预约)   → /me/services?tab=outgoing
 *
 * 注:本目录下的 booking-actions.tsx 仍被 /me/services 引用,勿删。
 */
export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab =
    typeof sp.tab === "string" && sp.tab === "outgoing" ? "outgoing" : "incoming";
  redirect(`/me/services?tab=${tab}`);
}
