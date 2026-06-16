import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

interface SeedService {
  title: string;
  description: string;
  qualification: string;
  categories: string[];
  formats: string[];
  durationTier: string;
  price: string;
}

interface SeedNeed {
  title: string;
  description: string;
  expectedProfile: string | null;
  reward: string;
  expectedTime: "ASAP" | "THIS_WEEK" | "TWO_WEEKS" | "FLEXIBLE";
  formatPreference: string;
  category: string;
}

const SEED_SERVICES: SeedService[] = [
  {
    title: "高等数学/线性代数 一对一辅导",
    description:
      "理工科在读硕士,擅长高数、线代、概率统计。可针对期末、考研做专题梳理与真题讲解,带课后答疑。线上腾讯会议或线下图书馆均可。",
    qualification: "某 985 数学系硕士,本科数学 GPA 3.9,带过 3 届期末辅导,累计 40+ 学生。",
    categories: ["学业辅导"],
    formats: ["线上", "线下"],
    durationTier: "1小时",
    price: "¥80/小时",
  },
  {
    title: "Python 数据分析入门 实战教学",
    description:
      "从零上手 pandas / numpy / matplotlib,结合真实数据集做一个小项目。适合想做数据分析、科研绘图的同学,课后提供录屏回放。",
    qualification: "数据科学方向研究生,Kaggle Expert,有 2 年 Python 教学经验。",
    categories: ["技能教学", "技术支持"],
    formats: ["线上"],
    durationTier: "2小时",
    price: "¥120/小时",
  },
  {
    title: "留学申请文书润色(英文)",
    description:
      "针对 PS / SoP / CV 提供逐句润色与逻辑优化,保留你的个人特色。3 轮修改,48 小时内返回,支持急件。可中文沟通。",
    qualification: "海外名校文科硕士,雅思 8.0,担任过 2 届申请季文书导师。",
    categories: ["文书润色"],
    formats: ["线上"],
    durationTier: "面议",
    price: "¥300/篇起",
  },
  {
    title: "本科转专业 / 选课 咨询规划",
    description:
      "结合自身经历,帮你梳理转专业可行性、目标院系要求、补课路径与时间规划。一对一语音咨询 30 分钟,赠送一份简要行动清单。",
    qualification: "成功跨院保研的过来人,熟悉本校多个院系培养方案。",
    categories: ["咨询规划"],
    formats: ["线上"],
    durationTier: "30分钟",
    price: "¥50/次",
  },
];

const SEED_NEEDS: SeedNeed[] = [
  {
    title: "急寻一位 Java 后端辅导(数据库 + Spring)",
    description:
      "下周有课程大作业,需要一位熟悉 Spring Boot + MyBatis + MySQL 的同学带我过一遍项目结构,最好能远程演示调试。可线上,时间灵活。",
    expectedProfile: "有实际项目经验、能讲清原理的优先,带过新人更好。",
    reward: "¥150/次,可加急",
    expectedTime: "ASAP",
    formatPreference: "线上",
    category: "技术支持",
  },
  {
    title: "求一份英文简历润色(数据岗)",
    description:
      "已有中文简历,需要转成英文并润色,目标投递海外数据分析师岗位。希望本周内完成,2 天内交付优先。",
    expectedProfile: "英语母语或雅思 7.5+,熟悉数据岗简历关键词。",
    reward: "¥200~300",
    expectedTime: "THIS_WEEK",
    formatPreference: "都可以",
    category: "文书润色",
  },
  {
    title: "找人设计一个社团招新海报",
    description:
      "需要一个 A3 尺寸的招新海报,风格清新活泼,含社团 logo 与二维码。两周内交付,可线上沟通,源文件也给我。",
    expectedProfile: "有海报作品集、熟练使用 PS/AI/Canva。",
    reward: "¥250,作品满意可加价",
    expectedTime: "TWO_WEEKS",
    formatPreference: "线上",
    category: "设计",
  },
];

function slotTimes(daysFromNow: number, startHour: number, hours = 1) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return { start, end };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 未设置");
  }

  // 复用已认证 demo_seller;否则创建 demo_provider + demo_requester。
  let provider = await prisma.user.findFirst({
    where: { email: "demo_seller@example.com", verificationStatus: "VERIFIED", deletedAt: null },
  });
  let createdProvider = false;
  if (!provider) {
    provider = await prisma.user.create({
      data: {
        email: "demo_provider@example.com",
        passwordHash: await hashPassword("devpass123"),
        realName: "演示提供者",
        studentId: "20240010",
        department: "示例学院",
        enrollmentYear: 2024,
        nickname: "demo_provider",
        verificationStatus: "VERIFIED",
      },
    });
    createdProvider = true;
    console.log("已创建演示提供者 demo_provider@example.com / devpass123");
  } else {
    console.log(`复用已认证提供者:${provider.email ?? provider.nickname}`);
  }

  let requester = await prisma.user.findFirst({
    where: { email: "demo_requester@example.com", verificationStatus: "VERIFIED", deletedAt: null },
  });
  let createdRequester = false;
  if (!requester) {
    requester = await prisma.user.create({
      data: {
        email: "demo_requester@example.com",
        passwordHash: await hashPassword("devpass123"),
        realName: "演示需求方",
        studentId: "20240011",
        department: "示例学院",
        enrollmentYear: 2024,
        nickname: "demo_requester",
        verificationStatus: "VERIFIED",
      },
    });
    createdRequester = true;
    console.log("已创建演示需求方 demo_requester@example.com / devpass123");
  } else {
    console.log(`复用已认证需求方:${requester.email ?? requester.nickname}`);
  }

  // ── 服务 + 时段(以 title 去重)──
  let svcCreated = 0;
  let svcUpdated = 0;
  let slotCount = 0;
  for (const s of SEED_SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { title: s.title },
      select: { id: true },
    });
    let serviceId: string;
    if (existing) {
      const upd = await prisma.service.update({
        where: { id: existing.id },
        data: {
          description: s.description,
          qualification: s.qualification,
          categories: s.categories,
          formats: s.formats,
          durationTier: s.durationTier,
          price: s.price,
          contactInfo: "微信:demo_provider_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: "ACTIVE",
        },
        select: { id: true },
      });
      serviceId = upd.id;
      svcUpdated += 1;
    } else {
      const created = await prisma.service.create({
        data: {
          providerId: provider.id,
          title: s.title,
          description: s.description,
          qualification: s.qualification,
          proofImageKeys: [],
          categories: s.categories,
          formats: s.formats,
          durationTier: s.durationTier,
          price: s.price,
          contactInfo: "微信:demo_provider_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: "ACTIVE",
        },
        select: { id: true },
      });
      serviceId = created.id;
      svcCreated += 1;
    }

    // 为新创建的服务添加 1~2 个未来时段(已存在的不再追加,保持幂等)。
    if (!existing) {
      const slots = [
        slotTimes(2, 19, 1),
        slotTimes(5, 14, s.durationTier === "2小时" ? 2 : 1),
      ];
      for (const sl of slots) {
        await prisma.serviceSlot.upsert({
          where: {
            serviceId_startAt_endAt: {
              serviceId,
              startAt: sl.start,
              endAt: sl.end,
            },
          },
          create: { serviceId, startAt: sl.start, endAt: sl.end },
          update: {},
        });
        slotCount += 1;
      }
    }
  }

  // ── 需求(以 title 去重)──
  let needCreated = 0;
  let needUpdated = 0;
  for (const n of SEED_NEEDS) {
    const existing = await prisma.need.findFirst({
      where: { title: n.title },
      select: { id: true },
    });
    if (existing) {
      await prisma.need.update({
        where: { id: existing.id },
        data: {
          description: n.description,
          expectedProfile: n.expectedProfile,
          reward: n.reward,
          expectedTime: n.expectedTime,
          formatPreference: n.formatPreference,
          category: n.category,
          contactInfo: "微信:demo_requester_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: "OPEN",
        },
      });
      needUpdated += 1;
    } else {
      await prisma.need.create({
        data: {
          requesterId: requester.id,
          title: n.title,
          description: n.description,
          expectedProfile: n.expectedProfile,
          reward: n.reward,
          expectedTime: n.expectedTime,
          formatPreference: n.formatPreference,
          category: n.category,
          contactInfo: "微信:demo_requester_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: "OPEN",
        },
      });
      needCreated += 1;
    }
  }

  console.log(
    `\n服务/需求种子完成:` +
      `\n  用户: 提供者 ${createdProvider ? "新建" : "复用"}, 需求方 ${createdRequester ? "新建" : "复用"}` +
      `\n  服务: 新增 ${svcCreated} 条, 更新 ${svcUpdated} 条, 新增时段 ${slotCount} 个, 共 ${SEED_SERVICES.length} 个服务` +
      `\n  需求: 新增 ${needCreated} 条, 更新 ${needUpdated} 条, 共 ${SEED_NEEDS.length} 条`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
