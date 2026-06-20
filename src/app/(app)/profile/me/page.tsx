import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * /profile/me → /profile/{当前用户 id}。
 * 用户猜不到自己的数据库 id,这个别名让「我的主页」可凭直觉直达。
 * 注意 Next 路由优先级:静态段 me 优先于动态段 [id],故放在 profile/me/ 目录。
 */
export default async function ProfileMePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/me");
  }
  redirect(`/profile/${session.user.id}`);
}
