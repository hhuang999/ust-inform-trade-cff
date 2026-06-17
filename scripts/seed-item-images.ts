/**
 * 为现有(无图)物品配真实免版税照片,直接 PutObject 到 R2 公开桶
 * (绕过浏览器/预签名/CORS),并回写 imageKeys。幂等:仅处理 imageKeys 为空的物品。
 *
 * 图片来源说明:本环境封锁了 Wikimedia 图片 CDN(upload.wikimedia.org),
 * 且 Unsplash/Pexels 的搜索 API 需要密钥,故当前采用 Lorem Picsum
 * (可达、免授权的真实照片),按物品关键词 seed 取确定性图片。
 * 后续若提供 Unsplash/Pexels API key,可替换为按类目精确匹配的真实照片。
 *
 * 运行:
 *   set -a; . ./.env.local; set +a; pnpm tsx scripts/seed-item-images.ts
 */
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "../src/lib/db";
import { itemImageKey } from "../src/lib/storage/paths";
import { r2, BUCKETS } from "../src/lib/storage/r2";

// 标题关键词 → 英文检索词(Wikimedia Commons 以英文为主,匹配更准)。
const KEYWORD_RULES: { match: RegExp; keyword: string }[] = [
  { match: /iPad|平板/, keyword: "iPad tablet" },
  { match: /高数|数学|微积分|线代|概率/, keyword: "mathematics textbook" },
  { match: /台灯|护眼灯/, keyword: "LED desk lamp" },
  { match: /Nike|外套|卫衣|夹克/, keyword: "sports jacket" },
  { match: /瑜伽/, keyword: "yoga mat" },
  { match: /吉他/, keyword: "acoustic guitar" },
  { match: /收纳|整理盒|储物/, keyword: "plastic storage box" },
  { match: /鼠标/, keyword: "computer wireless mouse" },
  { match: /充电宝|移动电源/, keyword: "power bank" },
  { match: /键盘/, keyword: "mechanical keyboard" },
  { match: /耳机/, keyword: "headphones" },
  { match: /自行车|单车/, keyword: "bicycle" },
  { match: /书|图书|课本|教材/, keyword: "stack of books" },
  { match: /椅|书桌|桌子/, keyword: "desk chair" },
  { match: /锅|厨具/, keyword: "cookware" },
  { match: /抱枕|枕头|被子/, keyword: "cushion pillow" },
];

// 类目兜底(标题未命中时按类目给一个英文关键词)。
const CATEGORY_FALLBACK: { match: RegExp; keyword: string }[] = [
  { match: /数码|电子|电器/, keyword: "consumer electronics gadget" },
  { match: /书|教材/, keyword: "textbook" },
  { match: /生活|家居|日用/, keyword: "household item" },
  { match: /服饰|鞋|包/, keyword: "clothing apparel" },
  { match: /运动|健身/, keyword: "fitness equipment" },
  { match: /乐器/, keyword: "musical instrument" },
  { match: /食品|零食/, keyword: "snack food" },
];

function keywordFor(item: { title: string; category: string }): string {
  for (const r of KEYWORD_RULES) if (r.match.test(item.title)) return r.keyword;
  for (const r of CATEGORY_FALLBACK) if (r.match.test(item.category)) return r.keyword;
  return item.title;
}

interface SourceImage {
  url: string;
  mime: string;
}

/** 按 item 关键词取一张确定性真实照片(本环境可达的 Lorem Picsum,免授权)。 */
async function fetchSourceImage(keyword: string): Promise<SourceImage | null> {
  const seed = encodeURIComponent(keyword.replace(/\s+/g, "-").toLowerCase());
  const url = `https://picsum.photos/seed/${seed}/900/675`;
  const probe = await fetch(url, { redirect: "follow" });
  if (!probe.ok || !(probe.headers.get("content-type") ?? "").startsWith("image/")) {
    return null;
  }
  return { url, mime: "image/jpeg" };
}

async function downloadBytes(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`下载失败 ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKETS.public,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL 未设置");
  if (!BUCKETS.public) throw new Error("R2_BUCKET_PUBLIC 未设置");

  const items = await prisma.item.findMany({
    where: { deletedAt: null, imageKeys: { isEmpty: true } },
    select: { id: true, title: true, category: true, sellerId: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`待配图物品:${items.length} 件\n`);

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  let ok = 0;
  let skipped = 0;

  for (const item of items) {
    const keyword = keywordFor(item);
    let img: SourceImage | null = null;
    try {
      img = await fetchSourceImage(keyword);
    } catch (e) {
      console.warn(`  [检索失败] ${item.title} (${keyword}): ${(e as Error).message}`);
    }
    if (!img) {
      console.warn(`  [无图] ${item.title} — 关键词"${keyword}"取图失败,跳过`);
      skipped += 1;
      continue;
    }
    try {
      const bytes = await downloadBytes(img.url);
      const key = itemImageKey(item.sellerId, randomUUID());
      await uploadToR2(key, bytes, img.mime);
      await prisma.item.update({
        where: { id: item.id },
        data: { imageKeys: [key] },
      });
      console.log(`  [完成] ${item.title} (${keyword})`);
      console.log(`         源:${img.url}`);
      if (base) console.log(`         R2:${base}/${key}`);
      ok += 1;
    } catch (e) {
      console.error(`  [上传失败] ${item.title}: ${(e as Error).message}`);
      skipped += 1;
    }
  }

  console.log(`\n配图完成:成功 ${ok} 件,跳过 ${skipped} 件。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
