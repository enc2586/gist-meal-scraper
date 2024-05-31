import { CustomDateType, WeekInYearType } from "./types";

export function dateSeqToNum([y, m, d]: CustomDateType): Number {
  return y * 10000 + m * 100 + d;
}

export function dateDelta(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const delta = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(delta / msPerDay);
}

export function isMonday([y, m, d]: CustomDateType) {
  return new Date(y, m - 1, d).getDay() === 1;
}

export function addDays(
  startDate: CustomDateType,
  delta: number = 6
): CustomDateType {
  const endDate = new Date(startDate.join("-"));
  endDate.setDate(endDate.getDate() + delta);
  const end = [
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    endDate.getDate(),
  ] as CustomDateType;
  return end;
}

/**
 * Get the week number of the year from the given date.
 * @param date Date in [yyyy, m, d] format
 * @returns year, number
 */
export function getWeekInYear([y, m, d]: CustomDateType): WeekInYearType {
  const startOfYear = new Date(y, 0, 1);
  const targetDate = new Date(y, m - 1, d);
  const weekNumber = Math.ceil(
    ((targetDate.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );
  return {
    year: y,
    week: weekNumber,
  };
}

export function getDateStr([y, m, d]: CustomDateType): string {
  return `${y}${m.toString().padStart(2, "0")}${d.toString().padStart(2, "0")}`;
}

const signatures: Record<string, string> = {
  R0lGODdh: "image/gif",
  R0lGODlh: "image/gif",
  iVBORw0KGgo: "image/png",
  "/9j/": "image/jpg",
};

export function detectMimeType(b64: string): string | undefined {
  for (const s of Object.keys(signatures)) {
    if (b64.indexOf(s) === 0) {
      return signatures[s];
    }
  }
}
