import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BUCKETS, MAX_IMAGE_BYTES, presignUpload } from "@/lib/storage/r2";
import { avatarKey, studentIdKey, itemImageKey } from "@/lib/storage/paths";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { purpose: "avatar" | "student-id" | "item" };
  const userId = session.user.id;

  const rand = crypto.randomUUID();
  let bucket: string;
  let key: string;

  if (body.purpose === "avatar") {
    bucket = BUCKETS.public;
    key = avatarKey(userId, rand);
  } else if (body.purpose === "item") {
    // 物品图片:发布时 itemId 未知,以 sellerId 分桶存入公开桶。
    bucket = BUCKETS.public;
    key = itemImageKey(userId, rand);
  } else {
    // student-id 需要已认证?不:未认证也可提交认证申请,只要有登录态
    bucket = BUCKETS.private;
    // requestId 在前端创建申请前用临时 id 占位;这里用 user+rand,真正提交时回填
    key = studentIdKey(`u_${userId}`, rand);
  }

  const post = await presignUpload({
    bucket,
    key,
    maxBytes: MAX_IMAGE_BYTES,
    contentTypePrefix: "image/",
  });

  return NextResponse.json({ post, key });
}
