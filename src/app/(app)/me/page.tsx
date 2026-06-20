import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * /me 的落地重定向。
 * /me 本身不是页面,而是「我的」功能的聚合目录;用户从书签 / 外链 / 直输 URL 访问 /me
 * 时,登录态跳到「物品交易」(我的主入口),未登录跳登录(带回调)。
 */
export default async function MeIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/me");
  }
  redirect("/me/items");
}
