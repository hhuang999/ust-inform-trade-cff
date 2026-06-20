import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * /demands → /needs。
 * 需求列表路由英文命名是 needs,这里保留 demands 别名做向后兼容
 * (历史链接 / 用户直觉),并透传筛选参数。
 */
export default async function DemandsAliasPage({
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
  redirect(`/needs${suffix}`);
}
