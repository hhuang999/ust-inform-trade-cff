import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface PresignOptions {
  bucket: string;
  key: string;
  /** MIME 类型(须 image/*);签名进 PUT,客户端须以相同 Content-Type 上传 */
  contentType: string;
}

/**
 * 生成预签名 PUT URL。Cloudflare R2 **不支持** S3 presigned POST(policy),
 * 故改用 SigV4 预签名 PUT(R2 完整支持)。
 *
 * - Content-Type 签名进 URL,客户端上传须带完全一致的 Content-Type,否则 R2 拒绝。
 * - 体积上限:PUT 不像 POST policy 能在 R2 侧用 content-length-range 强制,
 *   故由客户端校验(见各表单的 MAX_IMAGE_BYTES)。
 */
export async function presignPut(
  opts: PresignOptions
): Promise<{ url: string; key: string }> {
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
    }),
    { expiresIn: 60 }
  );
  return { url, key: opts.key };
}

export const BUCKETS = {
  public: process.env.R2_BUCKET_PUBLIC!,
  private: process.env.R2_BUCKET_PRIVATE!,
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB(客户端校验用)
