import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 需求撮合已整合进「需求撮合」页(/me/needs)的 tab。
 * 本路由保留为重定向,使历史通知链接与 revalidatePath 不致 404。
 * - tab=incoming(我的应征)   → /me/needs?tab=incoming
 * - tab=outgoing(我的需求匹配)→ /me/needs?tab=outgoing
 *
 * 注:本目录下的 match-actions.tsx 仍被 /me/needs 引用,勿删。
 */
export default async function MyMatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab =
    typeof sp.tab === "string" && sp.tab === "outgoing" ? "outgoing" : "incoming";
  redirect(`/me/needs?tab=${tab}`);
}
