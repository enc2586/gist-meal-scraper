import path from "path";
import fs from "fs";
import { parseDate } from "./dateparser";
import { downloadImg, scrapeMealBoard } from "./scraper";
import { ocrMeal } from "./ocr";
import { getWeekInYear } from "./utils";

type GetLastNMeals = {
  url: string;
  identifier: string;
  count: number;
  options?: { saveImg?: boolean; saveHistory?: boolean; skipWeekend?: boolean };
};

/**
 * Abstracts the process of getting the last N meals from the meal board.
 * @param url URL of the meal board
 * @param identifier custom Identifier for the meal board (e.g. "1학", "2학")
 * @param count Number of weeks to get
 * @param options Options for the process
 * @returns Array of objects containing the meal board data
 */
export async function getLastNMeals({
  url,
  identifier,
  count,
  options = { saveImg: false, saveHistory: false, skipWeekend: false },
}: GetLastNMeals) {
  const { saveImg, saveHistory, skipWeekend } = options;

  const firstPageList = await scrapeMealBoard({ url, page: 1 });

  const lastTwoWeeks = firstPageList.slice(0, count);
  const lastTwoWeeksMeals = await Promise.all(
    lastTwoWeeks.map(async (item) => {
      const date = await parseDate(item);
      const { week, year } = getWeekInYear(date);
      const filename = `${year}-w${String(week).padStart(
        2,
        "0"
      )}_${identifier}`;

      const imgPath = path.resolve(__dirname, "../images", `${filename}.jpg`);
      await downloadImg(item.imgUrl, imgPath);

      console.log(imgPath, "OCRing... (est. <1m)");
      const meals = await ocrMeal({ imgPath, date, options: { skipWeekend } });
      console.log(meals);
      console;

      if (!saveImg) {
        fs.unlinkSync(imgPath);
      }
      if (saveHistory) {
        const historyPath = path.resolve(
          __dirname,
          "../history",
          `${filename}.json`
        );

        fs.writeFileSync(historyPath, JSON.stringify(meals, null, 2));
      }

      return {
        ...item,
        imgPath,
        date,
        meals,
      };
    })
  );

  return lastTwoWeeksMeals;
}
