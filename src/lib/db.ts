import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7's client engine requires a driver adapter at runtime (it no longer
// auto-reads DATABASE_URL). PrismaPg connects to any PostgreSQL instance —
// local Docker in dev, Neon in production — via the DATABASE_URL string.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon(远端 DB)冷启动 + 跨区延迟下,空闲后的首个查询常因 TCP 握手超时
// 抛 ETIMEDOUT(及类似的瞬时网络错误),表现为页面"首次加载 500、刷新即恢复"。
// 这类错误意味着请求根本没到达 DB,重试是安全的;握手成功后重试即命中,
// 避免用户看到 "A server error occurred. Reload to try again."。
// Neon(远端 DB)冷启动 + 跨区延迟下,空闲后的首个查询常因 TCP 握手超时
// 抛 ETIMEDOUT(及类似的瞬时网络错误),表现为页面"首次加载 500、刷新即恢复"。
// 这类错误意味着请求根本没到达 DB,重试是安全的;握手成功后重试即命中,
// 避免用户看到 "A server error occurred. Reload to try again."。
// 扩展:覆盖 Neon 计算节点挂起/唤醒(code:9 / suspended / cannot_connect_now /
// 57P03 等)与连接被回收(connection terminated),让冷启动场景也走重试。
const TRANSIENT_ERR =
  /ETIMEDOUT|ENOTFOUND|ECONNRESET|EAI_AGAIN|P1001|P1002|P1008|P1017|timeout|terminated|code:? ?9|suspended|connection (?:terminated|refused)|cannot_connect_now|57P03|57P02|0800[16]/i;

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const e = err as { message?: unknown; code?: unknown };
      const msg = String(e?.message ?? e?.code ?? err);
      if (attempt >= retries || !TRANSIENT_ERR.test(msg)) throw err;
      // 短退避后重试,给 Neon 完成冷启动 / 重建 TCP 连接留时间。
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = new PrismaPg({ connectionString });
  const base = new PrismaClient({
    adapter,
    log: ["error", "warn"],
    // 远端 DB(Neon)延迟高于本地,放宽事务默认超时(默认 5s 在多语句事务下易超时)。
    transactionOptions: { maxWait: 10000, timeout: 20000 },
  });
  // 对所有查询统一套瞬时错误重试:一处覆盖所有页面,无需逐页 try/catch。
  const extended = base.$extends({
    query: {
      $allOperations({ query, args }) {
        return withRetry(() => query(args));
      },
    },
  });
  return extended as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
