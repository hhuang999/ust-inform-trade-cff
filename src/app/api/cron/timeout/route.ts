import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // TODO(P1/P2): 扫描超过 7 天未确认的 Pending Booking/Match/Item,标记 Completed
  return NextResponse.json({ ok: true, scanned: 0 });
}
