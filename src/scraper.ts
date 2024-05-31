import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import { CustomDateType, ScrapeResultType, WeekInYearType } from "./types";
import { log } from "./setup";

type ScrapeMealBoardInputs = {
  url: string;
  page?: number;
};

/**
 * Scrapes the meal board page and returns the list of weekly meal image, title (not menus).
 * @param url URL of the meal board
 * @param page Page number to scrape
 * @returns
 */
export async function scrapeMealBoard({
  url,
  page = 1,
}: ScrapeMealBoardInputs): Promise<ScrapeResultType[]> {
  const response = await axios.get(url + `?GotoPage=${page}`);

  if (response.status !== 200) throw new Error("Failed to load board page!");

  const html = response.data;
  const $ = cheerio.load(html);

  const weeklyMeals = $(
    "#txt > div.bd_container.bd_list > div.bd_list_wrap.col1.grid > div > div > a"
  );
  log(`Found ${weeklyMeals.length} weekly meals!`);

  const detailList = weeklyMeals.map((_, element) => {
    const el = $(element as any);
    const title = el.find("h2").text();
    const createdDateStr = el
      .find("em.bd_info")
      .contents()
      .filter(function () {
        return this.type === "text";
      })
      .text()
      .trim();

    return {
      title,
      imgUrl: url + el.find("img").attr("src"),
      createdDateStr,
    };
  });

  return [...detailList] as unknown as ScrapeResultType[];
}

/**
 * Downloads the image from the given URL and saves it to the destination.
 * @param url URL of the image
 * @param dest Destination path to save the image
 * @returns Promise
 */
export async function downloadImg(url: string, dest: string) {
  log("Downloading image from: " + url);
  const writer = fs.createWriteStream(dest);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", (arg: any) => {
      log("Image saved to: " + dest, "SUCCESS");
      resolve(arg);
    });
    writer.on("error", (arg: any) => {
      log("Failed to save image to: " + dest, "ERROR");
      reject(arg);
    });
  });
}

// private functions below ================================================
