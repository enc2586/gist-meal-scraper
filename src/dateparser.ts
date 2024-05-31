import { log } from "./setup";
import { askGpt } from "./openai";
import { CustomDate, CustomDateType } from "./types";
import { dateDelta, isMonday, dateSeqToNum } from "./utils";

type ParsePeriodInput = {
  title: string;
  createdDateStr: string;
  options?: {
    forceAI?: boolean;
    forceManual?: boolean;
    disableCorrection?: boolean;
    manualErrorCorrection?: boolean;
  };
};

/**
 * Parses the period of the meal board from the title.
 * First tries to parse the date manually(with logic), then uses AI if failed.
 * @param title Title of the meal board
 * @param createdDateStr Created date of the meal board
 * @param options Options for the parsing
 * @returns Start date of the period in [yyyy, m, d] format
 */
export async function parseDate({
  title,
  createdDateStr,
  options = {
    forceAI: false,
    forceManual: false,
  },
}: ParsePeriodInput): Promise<CustomDateType> {
  const { forceAI, forceManual } = options;

  // 우선 기계적 파싱 후 검증 시도
  if (!forceAI) {
    try {
      const date = manualParse(title, createdDateStr);

      if (dateDelta(new Date(date.join("-")), new Date(createdDateStr)) > 30) {
        throw new Error("Period is too far from created date");
      }

      if (!isMonday(date)) {
        throw new Error("Period does not start on Monday");
      }

      return date;
    } catch (e) {
      console.error(e);
    }
  }

  // 기계적 파싱 실패 시 AI로 파싱 시도
  if (!forceManual) {
    try {
      const date = await aiParse(title, createdDateStr);

      if (dateDelta(new Date(date.join("-")), new Date(createdDateStr)) > 30) {
        throw new Error("Period is too far from created date");
      }

      if (!isMonday(date)) {
        throw new Error("Period does not start on Monday");
      }

      return date;
    } catch (e) {
      log(`Failed AI Parsing- Giving up: "${title}"`, "ERROR");
      console.error(e);
      throw new Error("Failed to parse date with AI");
    }
  }

  throw new Error("Failed to parse date");
}

async function aiParse(
  title: string,
  createdDateStr: string
): Promise<CustomDateType> {
  const systemContent = `Given the title of an article that contains a week's worth of college meal menus, find the time range's start date for that week into simple json array as following:
[yyyy, m, d]

Refer the caveats below
 - The title may contain dates in various formats.
 - The title may contain other information besides dates.
 - For guidance, the article's created date is provided as a reference. (usually created date is within a week of the meal period)
 - The title almost always includes the starting date.
 - Return only cleaned data in JSON array format. No other responses are allowed.
 - Do not use backticks to mark json blocks.
`;

  const response = await askGpt({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `created-date: ${createdDateStr}, title: ${title}`,
      },
    ],
    temperature: 0,
  });

  const result = response?.choices[0].message.content;
  if (!result) {
    throw new Error("Failed get response from AI");
  }

  const start = CustomDate.parse(JSON.parse(result));

  return CustomDate.parse(start);
}

function manualParse(title: string, createdDateStr: string): CustomDateType {
  const target = extractDateStartingStr(title) || title;
  const numbers = target.match(/\d+/g)?.map(Number);
  if (!numbers) throw new Error("No numbers found from title");

  if (numbers.length < 3) {
    throw new Error("Not enough numbers found from title");
  }

  // numbers가 3~5개일 경우 정적 파싱 시도
  else if (numbers.length < 6) {
    const criteria = new Date(createdDateStr);
    let [y, m, d] = [0, 0, 0];
    switch (numbers.length) {
      case 3: // "MM월 DD일 ~ DD일" 꼴 가정
      case 4: // "MM월 DD일 ~ MM월 DD일" 꼴 가정
        [m, d] = numbers;
        break;
      case 5: // "YYYY년 MM월 DD일 ~ MM월 DD일" 꼴 가정
        [y, m, d] = numbers;
        break;
    }
    if (y === 0) y = criteria.getFullYear();

    const result = CustomDate.parse([y, m, d]);

    return result;
  }

  // numbers가 6개 이상일 경우 동적 파싱 시도
  else {
    let dates: CustomDateType[] = numbers.reduce((candidates, num, i) => {
      if (String(num).length === 4 && i < numbers.length - 2) {
        const [y, m, d] = numbers.slice(i, i + 3);
        if (CustomDate.safeParse([y, m, d]).success) {
          const isDuplicate = candidates.some(([yy, mm, dd]) => {
            return yy === y && mm === m && dd === d;
          });
          if (!isDuplicate) candidates.push([y, m, d]);
        }
      }
      return candidates;
    }, [] as CustomDateType[]);

    if (dates.length > 2) {
      throw new Error("Too many valid dates found from title");
    } else if (dates.length < 2) {
      throw new Error("Not enough valid dates found from title");
    }

    const [date1, date2] = dates;

    const isReversed = dateSeqToNum(date1) > dateSeqToNum(date2);
    const start = !isReversed ? date1 : date2;

    return start;
  }
}

function extractDateStartingStr(str: string) {
  const patterns = [/\d+\//, /\d+\./, /\d+년/, /\d+월/];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) return str.slice(match.index);
  }

  return null;
}
