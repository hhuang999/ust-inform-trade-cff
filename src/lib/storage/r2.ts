import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

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
  /** 最大字节数 */
  maxBytes: number;
  /** 允许的 MIME 前缀,如 "image/" */
  contentTypePrefix: string;
}

/** 生成预签名 POST,在 R2 侧强制 MIME 前缀 + 大小上限。客户端需自行追加 Content-Type(见 Task 14)。*/
export async function presignUpload(opts: PresignOptions) {
  return createPresignedPost(r2, {
    Bucket: opts.bucket,
    Key: opts.key,
    Conditions: [
      ["content-length-range", 0, opts.maxBytes],
      ["starts-with", "$Content-Type", opts.contentTypePrefix],
    ],
    Expires: 60,
  });
}

export const BUCKETS = {
  public: process.env.R2_BUCKET_PUBLIC!,
  private: process.env.R2_BUCKET_PRIVATE!,
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
