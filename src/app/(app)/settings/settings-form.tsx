"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { submitVerificationAction, type SubmitState } from "./actions";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { Button } from "@/components/ui/button";
import { type VerificationStatus } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB,与后端 MAX_IMAGE_BYTES 保持一致
const ANIM = "animate-in fade-in slide-in-from-bottom-4 duration-500";

type UploadedPhoto = { key: string; name: string; url: string };

interface SettingsFormProps {
  verificationStatus: VerificationStatus;
  avatarUrl: string | null;
  nickname: string;
}

export default function SettingsForm({
  verificationStatus,
  avatarUrl,
  nickname,
}: SettingsFormProps) {
  const [state, formAction] = useActionState<SubmitState, FormData>(
    submitVerificationAction,
    {}
  );
  const [isSubmitting, startTransition] = useTransition();

  // 头像
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  // 学生证
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);

  const isVerified = verificationStatus === "VERIFIED";

  /** 校验单张图片:类型 + 大小。失败弹 toast 并返回 null。 */
  function validateImage(file: File): boolean {
    if (!file.type.startsWith("image/")) {
      toast.error("仅支持图片格式");
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("图片过大，请压缩到 5MB 以内");
      return false;
    }
    return true;
  }

  /** 请求 presign;网络/R2 凭据缺失时返回 null 并 toast。 */
  async function getPresign(
    purpose: "avatar" | "student-id",
    file: File
  ): Promise<{ url: string; key: string } | null> {
    try {
      const res = await fetch(withBasePath("/api/upload-url"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, contentType: file.type }),
      });
      if (!res.ok) throw new Error("presign failed");
      return (await res.json()) as { url: string; key: string };
    } catch {
      // R2 凭据缺失 / presign 失败时优雅降级
      toast.error("无法获取上传凭证，请稍后再试");
      return null;
    }
  }

  /** 预签名 PUT 直传(R2 不支持 presigned POST),失败 toast。 */
  async function uploadToR2(url: string, file: File): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("upload failed");
      return true;
    } catch {
      toast.error("上传失败，请重试");
      return false;
    }
  }

  /** 处理头像选择 */
  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选择同一文件
    if (!file) return;
    if (!validateImage(file)) return;

    const presigned = await getPresign("avatar", file);
    if (!presigned) return;

    setAvatarUploading(true);
    setAvatarProgress(15);
    // 先本地预览(提升纸感即时反馈)
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    // 模拟进度(无法读取 POST 上传的真实进度)
    const tick = setInterval(
      () => setAvatarProgress((p) => (p < 85 ? p + 5 : p)),
      120
    );

    const ok = await uploadToR2(presigned.url, file);
    clearInterval(tick);
    setAvatarProgress(100);

    if (ok) {
      // 用真实 R2 key 拼出公开 URL 作为最终预览
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${presigned.key}`;
      setAvatarPreview(publicUrl);
      toast.success("头像已更新");
    } else {
      setAvatarPreview(avatarUrl); // 失败回退到原图
    }

    setTimeout(() => {
      setAvatarUploading(false);
      setAvatarProgress(0);
    }, 400);
  }

  /** 处理学生证选择(可多张) */
  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const valid = files.filter(validateImage);
    if (valid.length === 0) return;

    setPhotoUploading(true);
    setPhotoProgress(10);
    const tick = setInterval(
      () => setPhotoProgress((p) => (p < 80 ? p + 5 : p)),
      150
    );

    const uploaded: UploadedPhoto[] = [];
    for (const file of valid) {
      const presigned = await getPresign("student-id", file);
      if (!presigned) break;
      const ok = await uploadToR2(presigned.url, file);
      if (ok) {
        uploaded.push({
          key: presigned.key,
          name: file.name,
          url: URL.createObjectURL(file),
        });
      }
    }

    clearInterval(tick);
    setPhotoProgress(100);

    if (uploaded.length > 0) {
      setPhotos((prev) => [...prev, ...uploaded]);
      toast.success(
        `已上传 ${uploaded.length} 张${
          verificationStatus === "UNVERIFIED" || verificationStatus === "REJECTED"
            ? "，点击「提交认证」完成提交"
            : ""
        }`
      );
    }

    setTimeout(() => {
      setPhotoUploading(false);
      setPhotoProgress(0);
    }, 500);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  const initial = (nickname ?? "?").charAt(0).toUpperCase();

  return (
    <>
      {/* 头像卡 */}
      <Card className={cn(ANIM, "[animation-delay:75ms]")}>
        <CardHeader>
          <CardTitle className="font-serif text-base">头像</CardTitle>
          <CardDescription>支持 JPG / PNG，5MB 以内</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="size-20 ring-2 ring-outline-variant/40 shadow-card">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={nickname} />
                ) : null}
                <AvatarFallback className="bg-accent text-xl font-semibold text-foreground/70">
                  {initial}
                </AvatarFallback>
              </Avatar>
              {avatarUploading ? (
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-outline-variant/40">
                  <Loader2 className="size-4 animate-spin text-primary" />
                </span>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="w-fit active:scale-[0.98]"
              >
                <Camera />
                更换头像
              </Button>
              {avatarUploading ? (
                <div className="w-full max-w-xs space-y-1">
                  <Progress value={avatarProgress} />
                  <p className="text-xs text-muted-foreground">上传中…</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  点击按钮选择新头像
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生证认证卡 */}
      <Card className={cn(ANIM, "[animation-delay:150ms]")}>
        <CardHeader>
          <CardTitle className="font-serif text-base">学生证认证</CardTitle>
          <CardDescription>
            上传清晰的学生证照片，提交后由管理员审核。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerified ? (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-verified-soft px-3.5 py-2.5 text-sm text-verified ring-1 ring-inset ring-verified/20">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>你已通过认证，通常无需重新上传。如需更换仍可继续。</span>
            </div>
          ) : null}

          <form
            action={(fd) => startTransition(() => formAction(fd))}
            className="space-y-4"
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-card px-4 py-8 text-center transition-colors",
                "hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99]",
                photoUploading && "pointer-events-none opacity-70"
              )}
            >
              {photoUploading ? (
                <Loader2 className="size-7 animate-spin text-primary" />
              ) : (
                <Upload className="size-7 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {photoUploading ? "上传中…" : "点击或拖放选择图片"}
              </span>
              <span className="text-xs text-muted-foreground">
                支持多张，仅限图片格式，单张 ≤ 5MB
              </span>
            </button>

            {photoUploading ? (
              <div className="space-y-1">
                <Progress value={photoProgress} />
                <p className="text-xs text-muted-foreground">正在上传…</p>
              </div>
            ) : null}

            {photos.length > 0 ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {photos.map((p, i) => (
                    <div
                      key={p.key}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-outline-variant/40 bg-accent shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground/70 shadow-sm ring-1 ring-outline-variant/40 transition-colors hover:bg-background hover:text-destructive active:scale-95"
                        aria-label="移除"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-verified" />
                  已选 {photos.length} 张
                </p>
              </div>
            ) : null}

            <input type="hidden" name="photoKeys" value={photos.map((p) => p.key).join(",")} />

            {state.error ? (
              <p className="rounded-lg bg-rejected-soft px-3 py-2 text-sm text-rejected ring-1 ring-inset ring-rejected/20">
                {state.error}
              </p>
            ) : null}
            {state.ok ? (
              <p className="flex items-center gap-1.5 rounded-lg bg-verified-soft px-3 py-2 text-sm text-verified ring-1 ring-inset ring-verified/20">
                <CheckCircle2 className="size-4 shrink-0" />
                学生证已提交，等待审核
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || photos.length === 0}
              className="w-full active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  提交中…
                </>
              ) : (
                "提交认证"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
