import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import type { ItemStatus, PriceMode } from "@prisma/client";

interface SeedItem {
  title: string;
  description: string;
  category: string;
  condition: string;
  priceMode: PriceMode;
  price: number | null;
  originalPrice: number | null;
  tradeMethods: string[];
  status: ItemStatus;
}

const SEED_ITEMS: SeedItem[] = [
  {
    title: "iPad Air 第四代 64G 自用一年",
    description:
      "自用一年,成色很好,无划痕磕碰。配原装充电线,带一张类纸膜。毕业后转让,支持自提或邮寄。",
    category: "数码电子",
    condition: "几乎全新",
    priceMode: "SPECIFIC",
    price: 2800,
    originalPrice: 4799,
    tradeMethods: ["自提", "邮寄"],
    status: "AVAILABLE",
  },
  {
    title: "《高等数学》同济第七版 上下册",
    description:
      "考研复习用书,书内有一些铅笔批注,不影响阅读。两本一起出,校内自提。",
    category: "书籍教材",
    condition: "轻微使用痕迹",
    priceMode: "SPECIFIC",
    price: 25,
    originalPrice: 60,
    tradeMethods: ["自提"],
    status: "AVAILABLE",
  },
  {
    title: "宜家台灯 LED 护眼 学习办公",
    description:
      "搬家闲置,LED 光源不刺眼,三档亮度可调。灯罩有一处小瑕疵(见图),功能完全正常。",
    category: "生活用品",
    condition: "轻微使用痕迹",
    priceMode: "SPECIFIC",
    price: 45,
    originalPrice: 129,
    tradeMethods: ["自提", "送货"],
    status: "AVAILABLE",
  },
  {
    title: "Nike 运动外套 男款 L 码",
    description: "买大了一码,只试穿过,全新带吊牌。黑色经典款,百搭。",
    category: "服饰鞋包",
    condition: "全新",
    priceMode: "SPECIFIC",
    price: 199,
    originalPrice: 499,
    tradeMethods: ["自提", "邮寄"],
    status: "AVAILABLE",
  },
  {
    title: "瑜伽垫 加厚防滑 含绑带",
    description: "宿舍健身闲置,8mm 加厚,回弹好。赠送收纳绑带,九成新。",
    category: "运动健身",
    condition: "几乎全新",
    priceMode: "SPECIFIC",
    price: 35,
    originalPrice: 89,
    tradeMethods: ["自提"],
    status: "AVAILABLE",
  },
  {
    title: "雅马哈 38 寺入门木吉他",
    description:
      "初学入门款,音准稳定,适合零基础。送琴包和拨片。轻微使用痕迹,无明显磕碰。",
    category: "乐器",
    condition: "轻微使用痕迹",
    priceMode: "NEGOTIABLE",
    price: null,
    originalPrice: null,
    tradeMethods: ["自提"],
    status: "AVAILABLE",
  },
  {
    title: "闲置收纳盒(免费出)",
    description: "宿舍整理出来的塑料收纳盒两个,完好可用。免费出,先到先得,仅限自提。",
    category: "生活用品",
    condition: "轻微使用痕迹",
    priceMode: "FREE",
    price: null,
    originalPrice: null,
    tradeMethods: ["自提"],
    status: "AVAILABLE",
  },
  {
    title: "罗技无线鼠标 静音版",
    description: "已有人选中交易中,暂停接单。如取消会重新上架。",
    category: "数码电子",
    condition: "几乎全新",
    priceMode: "SPECIFIC",
    price: 59,
    originalPrice: 119,
    tradeMethods: ["自提", "邮寄"],
    status: "PENDING",
  },
  {
    title: "小米充电宝 10000mAh",
    description: "已售出,谢谢关注。",
    category: "数码电子",
    condition: "轻微使用痕迹",
    priceMode: "SPECIFIC",
    price: 49,
    originalPrice: 99,
    tradeMethods: ["自提"],
    status: "SOLD",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 未设置");
  }

  // 确保至少存在一个已认证卖家。
  let seller = await prisma.user.findFirst({
    where: { verificationStatus: "VERIFIED", deletedAt: null },
  });
  if (!seller) {
    seller = await prisma.user.create({
      data: {
        email: "demo_seller@example.com",
        passwordHash: await hashPassword("devpass123"),
        realName: "演示卖家",
        studentId: "20240001",
        department: "示例学院",
        enrollmentYear: 2024,
        nickname: "demo_seller",
        verificationStatus: "VERIFIED",
      },
    });
    console.log("已创建演示卖家 demo_seller@example.com / devpass123");
  } else {
    console.log(`复用已认证卖家:${seller.email ?? seller.nickname}`);
  }

  // upsert 物品(以 title 为去重键)。
  let created = 0;
  let updated = 0;
  for (const it of SEED_ITEMS) {
    const existing = await prisma.item.findFirst({
      where: { title: it.title },
      select: { id: true },
    });
    if (existing) {
      await prisma.item.update({
        where: { id: existing.id },
        // 更新时不写 imageKeys:保留既有图片(例如 seed-item-images 已配的真实照片),
        // 避免重跑种子把图片清空。新建物品仍以 imageKeys:[] 起步,由配图脚本补充。
        data: {
          description: it.description,
          category: it.category,
          condition: it.condition,
          priceMode: it.priceMode,
          price: it.price,
          originalPrice: it.originalPrice,
          tags: [],
          tradeMethods: it.tradeMethods,
          pickupLocation: it.tradeMethods.includes("自提") ? "校内约定地点" : null,
          contactInfo: "微信:demo_seller_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: it.status,
        },
      });
      updated += 1;
    } else {
      await prisma.item.create({
        data: {
          sellerId: seller.id,
          title: it.title,
          description: it.description,
          category: it.category,
          condition: it.condition,
          priceMode: it.priceMode,
          price: it.price,
          originalPrice: it.originalPrice,
          imageKeys: [],
          tags: [],
          tradeMethods: it.tradeMethods,
          pickupLocation: it.tradeMethods.includes("自提") ? "校内约定地点" : null,
          contactInfo: "微信:demo_seller_wx",
          contactVisibility: "VERIFIED_ONLY",
          status: it.status,
        },
      });
      created += 1;
    }
  }

  console.log(`\n物品种子完成:新增 ${created} 条,更新 ${updated} 条,共 ${SEED_ITEMS.length} 条。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
