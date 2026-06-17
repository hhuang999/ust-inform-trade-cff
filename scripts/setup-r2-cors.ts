/**
 * 一次性基础设施脚本:给 R2 公开/私有桶配置 CORS。
 *
 * 浏览器直传(presigned POST)需要桶允许跨域 PUT/POST,否则前端上传会被
 * 浏览器 CORS 策略拦截(No 'Access-Control-Allow-Origin' header)。
 *
 * 鉴权由预签名承担(不携带 cookie/Authorization),故 AllowedOrigins 用 *
 * 是安全的;如需收紧,可改为具体域名(本地 http://localhost:3000 + 生产域名)。
 *
 * 用法(带 DATABASE 无关,只需 R2 凭证):
 *   set -a && source .env.local && set +a && pnpm tsx scripts/setup-r2-cors.ts
 */
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const publicBucket = process.env.R2_BUCKET_PUBLIC;
const privateBucket = process.env.R2_BUCKET_PRIVATE;

if (!accountId || !accessKeyId || !secretAccessKey || !publicBucket || !privateBucket) {
  throw new Error("缺少 R2 环境变量(R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_PUBLIC / R2_BUCKET_PRIVATE)");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  for (const bucket of [publicBucket, privateBucket]) {
    await client.send(
      new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: corsConfig })
    );
    console.log(`✓ CORS 已设置:${bucket}`);
  }
  console.log("\n两个桶的 CORS 均已就绪,浏览器直传上传现在可用。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.destroy());
