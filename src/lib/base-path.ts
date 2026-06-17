/**
 * 运行时路径前缀(沙箱 /apps/<应用名>/;本地为空字符串)。
 * 由 next.config.ts 的 env.NEXT_PUBLIC_BASE_PATH 在构建期内联到客户端,服务端同样可见。
 *
 * 用途:仅给「绕过 Next 路由的原生请求」手动拼前缀,例如:
 *   - 客户端 fetch("/api/upload-url")、fetch("/api/notifications")
 *   - 原生 <form action="/items" method="get">、<img src="/api/admin/student-id">
 *
 * next/link 的 <Link>、useRouter、server action、/_next 静态资源均由 basePath 自动带前缀,无需手动拼。
 */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 在路径前拼上 basePath;BASE_PATH 为空时原样返回。 */
export function withBasePath(path: string): string {
  return BASE_PATH ? `${BASE_PATH}${path}` : path;
}
