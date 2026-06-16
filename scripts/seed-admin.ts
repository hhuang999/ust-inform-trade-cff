import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("请设置 ADMIN_EMAIL 环境变量");

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error(`未找到邮箱为 ${email} 的用户,请先注册该账号`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", verificationStatus: "VERIFIED" },
  });
  console.log(`已将 ${updated.email} 设为 ADMIN`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
