import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined;
  // 仅允许同源相对路径,防开放重定向(拒绝绝对 URL / 协议相对 //)。
  const callbackUrl =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
  return <LoginForm callbackUrl={callbackUrl} />;
}
