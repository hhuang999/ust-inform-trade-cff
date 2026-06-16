import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { r2, BUCKETS } from "@/lib/storage/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) {
    return new Response("Forbidden", { status: 403 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });
  if (!key.startsWith("private/student-ids/")) {
    return new Response("Invalid key", { status: 400 });
  }

  const obj = await r2.send(
    new GetObjectCommand({ Bucket: BUCKETS.private, Key: key })
  );
  if (!obj.Body) return new Response("Not found", { status: 404 });

  // In Node runtime, obj.Body is a Readable stream that undici's Response
  // accepts directly; cast satisfies the DOM BodyInit type gap.
  return new Response(obj.Body as unknown as BodyInit, {
    headers: {
      "Content-Type": obj.ContentType ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
