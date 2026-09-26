import type { Cabinet, EnvReading } from "./types";

/** 库房环境上限：超过即记为异常 */
export const TEMP_LIMIT = 24;
export const HUMIDITY_LIMIT = 60;

export const SHIFTS = ["早班", "中班", "晚班", "夜班"];

export function isAbnormal(reading: Pick<EnvReading, "temperature" | "humidity">): boolean {
  return reading.temperature > TEMP_LIMIT || reading.humidity > HUMIDITY_LIMIT;
}

export function roomReadings(readings: EnvReading[], roomId: string): EnvReading[] {
  return readings.filter((r) => r.roomId === roomId);
}

export function latestReading(readings: EnvReading[], roomId: string): EnvReading | null {
  const list = roomReadings(readings, roomId);
  return list.length > 0 ? list[list.length - 1] : null;
}

/**
 * 登记一条新读数后重算柜位状态：
 * - 同一库房连续两班异常 → 库内柜位冻结；
 * - 冻结中读到正常读数 → 异常消除，转入待复核（仍冻结）；
 * - 冻结中又出现异常 → 撤销待复核，继续冻结。
 * readings 为登记前的历史台账（不含 reading 本身）。
 */
export function applyReading(cabinets: Cabinet[], readings: EnvReading[], reading: EnvReading): Cabinet[] {
  const history = roomReadings(readings, reading.roomId);
  const previous = history.length > 0 ? history[history.length - 1] : null;
  const abnormalNow = isAbnormal(reading);
  const abnormalPrev = previous !== null && isAbnormal(previous);

  return cabinets.map((cabinet) => {
    if (cabinet.roomId !== reading.roomId) return cabinet;

    if (!cabinet.frozen) {
      if (abnormalNow && abnormalPrev) {
        return {
          ...cabinet,
          frozen: true,
          frozenAt: reading.recordedAt,
          freezeReason: "连续两班读数超上限",
          pendingReview: false,
          clearedByReadingId: null,
          reviewedBy: null,
          reviewedAt: null,
        };
      }
      return cabinet;
    }

    if (abnormalNow) {
      return { ...cabinet, pendingReview: false, clearedByReadingId: null };
    }
    return { ...cabinet, pendingReview: true, clearedByReadingId: reading.id };
  });
}

export type ReviewResult = { ok: true; cabinet: Cabinet } | { ok: false; message: string };

/** 复核解冻：须已登记正常读数（待复核），且复核人不能是最近一条读数的登记人 */
export function reviewUnfreeze(
  cabinet: Cabinet,
  reviewerId: string,
  readings: EnvReading[],
  reviewedAt: string
): ReviewResult {
  if (!cabinet.frozen) return { ok: false, message: "该柜位当前未冻结" };
  if (!cabinet.pendingReview) return { ok: false, message: "异常尚未消除，需先登记一班正常读数" };
  const last = latestReading(readings, cabinet.roomId);
  if (last && last.recorderId === reviewerId) {
    return { ok: false, message: "须由另一名值班员复核（不能与最近登记人相同）" };
  }
  return {
    ok: true,
    cabinet: {
      ...cabinet,
      frozen: false,
      pendingReview: false,
      reviewedBy: reviewerId,
      reviewedAt,
    },
  };
}

export function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function shiftForNow(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "早班";
  if (hour >= 12 && hour < 18) return "中班";
  if (hour >= 18 && hour < 24) return "晚班";
  return "夜班";
}
