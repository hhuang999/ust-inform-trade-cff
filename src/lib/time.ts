/**
 * 全站时间格式化工具(统一时区 Asia/Shanghai,即 CST)。
 *
 * 为什么存在:数据库存 UTC instant,而展示大量写在服务端组件里用 getHours/getDate/
 * toLocaleString(不传 timeZone)。Vercel 默认 server TZ=UTC,于是对 UTC+8 的用户
 * 所有时间会少 8 小时(并可能跨日)。本模块用 Intl.DateTimeFormat 显式指定 timeZone,
 * 让服务端与客户端渲染口径一致,不再依赖宿主时区。
 *
 * 用法:展示任何 DateTime 字段时,用这里的函数,不要 new Date(iso).getHours()。
 */

const TZ = "Asia/Shanghai";

/** 取 CST 下某 instant 的各日历字段(补零字符串)。 */
function cstFields(iso: string | Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
} {
  const d = iso instanceof Date ? iso : new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const get = (type: string): string =>
    fmt.formatToParts(d).find((p) => p.type === type)?.value ?? "";
  // 个别 ICU 实现在 hour12:false 下把午夜返回 "24",收敛为 "00"。
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

/** YYYY-MM-DD(CST)。 */
export function formatDate(iso: string | Date): string {
  const { year, month, day } = cstFields(iso);
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD HH:mm(CST)。 */
export function formatDateTime(iso: string | Date): string {
  const { year, month, day, hour, minute } = cstFields(iso);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/** HH:mm(CST)。 */
export function formatHM(iso: string | Date): string {
  const { hour, minute } = cstFields(iso);
  return `${hour}:${minute}`;
}

/** 通知/留言时间:与 now 同一天显示 HH:mm,否则 MM-DD HH:mm(CST)。 */
export function formatNoticeTime(iso: string | Date, now: Date): string {
  if (isSameDayCST(iso, now)) return formatHM(iso);
  const { month, day, hour, minute } = cstFields(iso);
  return `${month}-${day} ${hour}:${minute}`;
}

/** 两个 instant 在 CST 下是否同一天。 */
export function isSameDayCST(a: string | Date, b: string | Date): boolean {
  const fa = cstFields(a);
  const fb = cstFields(b);
  return fa.year === fb.year && fa.month === fb.month && fa.day === fb.day;
}

/**
 * 时段范围(CST):同日 "YYYY-MM-DD HH:mm ~ HH:mm",跨日两端都显示完整日期时间。
 */
export function formatSlotRangeCST(
  startIso: string | Date,
  endIso: string | Date,
): string {
  if (isSameDayCST(startIso, endIso)) {
    return `${formatDateTime(startIso)} ~ ${formatHM(endIso)}`;
  }
  return `${formatDateTime(startIso)} ~ ${formatDateTime(endIso)}`;
}
