import OpenAI from "openai";
import { z } from "zod";

const Year = z.number().gte(2020).lte(9999);

export const WeekInYear = z.object({
  year: Year,
  week: z.number(),
});

export const CustomDate = z
  .tuple([Year, z.number(), z.number()])
  .refine((date) => isDateValid(date), { message: "Invalid date" });

export const Period = z.object({
  start: CustomDate,
  end: CustomDate,
});

export const ScrapeResult = z.object({
  imgUrl: z.string(),
  title: z.string(),
  createdDateStr: z.string(),
});

export const OcrResult = z.record(
  z.object({
    breakfast: z.record(z.array(z.string())),
    lunch: z.record(z.array(z.string())),
    dinner: z.record(z.array(z.string())),
  })
);

export type WeekInYearType = z.infer<typeof WeekInYear>;
export type CustomDateType = z.infer<typeof CustomDate>;
export type PeriodType = z.infer<typeof Period>;
export type ScrapeResultType = z.infer<typeof ScrapeResult>;
export type OcrResultType = z.infer<typeof OcrResult>;

export type OpenaiBodyType =
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

// validation functions ================================================

function isDateValid([y, m, d]: [number, number, number]): boolean {
  if (y < 2020) return false;
  if (m < 1 || m > 12) return false;

  let maxDate = 31;
  if (m === 2) {
    if (y % 4 === 0) maxDate = 29;
    else maxDate = 28;
  } else {
    const delta = m > 7 ? 1 : 0;
    if ((m + delta) % 2 === 1) maxDate = 31;
    else maxDate = 30;
  }
  if (d < 1 || d > maxDate) return false;

  return true;
}
