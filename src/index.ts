import { init } from "./setup";
init();

import { getLastNMeals } from "./services";

const HAK1_URL = "https://www.gist.ac.kr/kr/html/sub05/050601.html";
const HAK2_URL = "https://www.gist.ac.kr/kr/html/sub05/050602.html";

async function main() {
  try {
    // getLastNMeals({
    //   url: HAK1_URL,
    //   identifier: "1학",
    //   count: 1,
    //   options: { saveImg: true, saveHistory: true, skipWeekend: true },
    // });

    getLastNMeals({
      url: HAK2_URL,
      identifier: "2학",
      count: 1,
      options: { saveImg: true, saveHistory: true, skipWeekend: false },
    });
  } catch (error) {
    console.error("Error while processing: ", error);
  }
}

main();
