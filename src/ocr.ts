import fs from "fs";
import { CustomDateType, OcrResult, OpenaiBodyType } from "./types";
import { askGpt } from "./openai";
import { detectMimeType, addDays } from "./utils";

type OcrMealInput = {
  imgPath: string;
  date: CustomDateType;
  options?: { skipWeekend?: boolean };
};

/**
 * OCR the meal board image with ChatGPT and return the meals in JSON format.
 * @param imgPath Path to the meal board image
 * @param date Date in [yyyy, m, d] format
 * @param options Options for the OCR process
 * @returns Meals in JSON format
 */
export async function ocrMeal({
  imgPath,
  date,
  options = { skipWeekend: false },
}: OcrMealInput) {
  const { skipWeekend } = options;

  const [y1, m1, d1] = date;
  const [y2, m2, d2] = addDays(date, skipWeekend ? 4 : 6);
  const periodStr = `${y1}.${m1}.${d1}~${y2}.${m2}.${d2}`;

  const systemContent = `Given a week's meal menu board image(usually in table form), period of week. OCR and organize breakfast,lunch,dinner sections and menus by day in the JSON type below.
{
 "YYYYMMDD": {
   "breakfast": {
     "<VARIANT>": [
       "<FOODNAME>",
       "<FOODNAME>", ...
     ],
     "<VARIANT>": [...]
    },
   "lunch": {...},
   "dinner": {...}
 }
}

Refer the caveats below
- No newline, indent, spacing allowed in JSON answer. Write in a single line.
- <VARIANT>, <FOODNAME> are not translated to English if they're written in Korean.
- <FOODNAME> is mainly composed of Korean characters. May have numbers at the end to indicate allergy info.
- <VARIANT> indicates type of foods served. ex) "일반", "일품", "한식", "코너"(for special menu), "간편식", etc.
- Typically, <VARIANT> is not explicitly differentiated. Can be inferred from the layout of image, differences between menus and food composition.
- If <VARIANT> is explicitly separated and has own label (usually "한식"/"일품" combination): label each <VARIANT> appropriately.
- If any distinct sections not found, and combinations of menus appear to be a single category: label the <VARIANT> as "일반" and include all foods in that section.
- Especially, assume simple meal like serials, toasts as "간편식" and divide them from "일반" VARIANT.
- If <VARIANT> label is not specified, but more than one type of section exists: label one as "일반" and name other sections with single word, as appropriate, based on layout of image and organization of menu.
- If particular column in table is marked with "---", "휴무", etc., or is empty, specific day/meal is missing, assume there are no meal at the particular time.
- *Include all ${
    skipWeekend ? 5 : 7
  } days of breakfast, lunch, and dinner information from Monday through ${
    skipWeekend ? "Friday" : "Sunday"
  }.* If there is holiday, the meals for that day should still exist, just represented as empty object.
- Return only cleaned data in JSON format. No other responses allowed.
- Don't use backticks to mark json blocks.`;

  const body = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: getImgBase64(imgPath),
            },
          },
          {
            type: "text",
            text: `period: ${periodStr}`,
          },
        ],
      },
    ],
    temperature: 0.2,
    top_p: 0.1,
  } as OpenaiBodyType;

  const response = await askGpt(body);
  if (!response?.choices[0].message.content) {
    throw new Error("No response from OpenAI");
  }

  const unsafeObject = JSON.parse(response.choices[0].message.content);
  const menus = OcrResult.parse(unsafeObject);

  return menus;
}

// private functions below ================================================

function getImgBase64(imagePath: string) {
  const base64 = fs.readFileSync(imagePath).toString("base64");
  const type = detectMimeType(base64) || "image/jpg";

  return `data:${type};base64,${base64}`;
}
