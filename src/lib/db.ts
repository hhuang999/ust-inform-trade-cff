import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7's client engine requires a driver adapter at runtime (it no longer
// auto-reads DATABASE_URL). PrismaPg connects to any PostgreSQL instance —
// local Docker in dev, Neon in production — via the DATABASE_URL string.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
    // 远端 DB(Neon)延迟高于本地,放宽事务默认超时(默认 5s 在多语句事务下易超时)。
    transactionOptions: { maxWait: 10000, timeout: 20000 },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
