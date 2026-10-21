import "server-only";

export type TimetableCell = { dayOfWeek: number; period: number; startTime: string; endTime: string; label: string };

/** Builds a Mon–Fri x period grid. Returns one row per period and five day cells (null when empty). */
export function weeklyGrid(entries: TimetableCell[]) {
  const periods = Array.from(new Set(entries.map((e) => e.period))).sort((a, b) => a - b);
  return periods.map((p) => {
    const sample = entries.find((e) => e.period === p);
    const cells = [1, 2, 3, 4, 5].map((day) => entries.find((e) => e.period === p && e.dayOfWeek === day)?.label ?? null);
    return { period: p, time: sample ? `${sample.startTime}–${sample.endTime}` : "", cells };
  });
}
