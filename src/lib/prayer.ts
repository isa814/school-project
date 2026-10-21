import "server-only";
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";

/** Lagos city centre, used for the school's prayer times. */
export const LAGOS = { latitude: 6.5244, longitude: 3.3792, timeZone: "Africa/Lagos" } as const;

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerRow = { key: PrayerKey; label: string; time: string; arabic: string };

const LABELS: Record<PrayerKey, { label: string; arabic: string }> = {
  fajr: { label: "Fajr", arabic: "الفجر" },
  dhuhr: { label: "Dhuhr", arabic: "الظهر" },
  asr: { label: "Asr", arabic: "العصر" },
  maghrib: { label: "Maghrib", arabic: "المغرب" },
  isha: { label: "Isha", arabic: "العشاء" },
};

/** The Lagos calendar date for `now`, as a UTC-noon Date (safe for any server time zone). */
function lagosDay(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "1");
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), 12));
}

function fmt(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: LAGOS.timeZone });
}

/** Today's five daily prayers for Lagos (Muslim World League method, Shafi'i Asr), and the next one due. */
export function todaysPrayers(now: Date = new Date()): { rows: PrayerRow[]; next: PrayerKey | null; sunrise: string } {
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(new Coordinates(LAGOS.latitude, LAGOS.longitude), lagosDay(now), params);
  const times: Record<PrayerKey, Date> = { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
  const rows = (Object.keys(times) as PrayerKey[]).map((key) => ({ key, label: LABELS[key].label, arabic: LABELS[key].arabic, time: fmt(times[key]) }));
  const nextRaw = pt.nextPrayer(now);
  const next = nextRaw === "none" || nextRaw === "sunrise" ? null : (nextRaw as PrayerKey);
  return { rows, next, sunrise: fmt(pt.sunrise) };
}

/** Today's Hijri (Islamic) date in Lagos, e.g. "12 Rabi' al-Awwal 1448 AH". */
export function hijriToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", calendar: "islamic-umalqura", timeZone: LAGOS.timeZone }).format(now);
}
