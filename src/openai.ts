import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { OpenaiBodyType } from "./types";
import { log } from "./setup";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function askGpt(
  body: OpenaiBodyType,
  options?: OpenAI.RequestOptions<unknown> | undefined
) {
  checkAndCreateLogFile();

  try {
    logOpenai("ASK", { body, options });
    const response = await openai.chat.completions.create(body, options);

    logOpenai("RESP", response);
    return response;
  } catch (error) {
    console.error("Error while processing:", error);
    logOpenai("ERROR", error as object);
  }
}

// private functions below ================================================

const OPENAI_LOG_FILE = path.resolve(__dirname, "../logs", "openai.log");
const OPENAI_LOGGING_ENABLED = process.env.OPENAI_LOGGING_ENABLED === "true";

function checkAndCreateLogFile() {
  if (!OPENAI_LOGGING_ENABLED) return;

  if (!fs.existsSync(OPENAI_LOG_FILE)) {
    log("OpenAI log file not found- CREATING new one", "WARN");
    fs.writeFileSync(OPENAI_LOG_FILE, "");
  }
}

function logOpenai(type: "ASK" | "RESP" | "ERROR", data: string | object) {
  if (!OPENAI_LOGGING_ENABLED) return;

  if (typeof data === "object") data = JSON.stringify(truncateStrings(data));
  const logLine = `${new Date().toISOString()} ${type} ${data}\n`;
  fs.appendFileSync(OPENAI_LOG_FILE, logLine);
}

function truncateStrings(oldObj: any) {
  const obj = { ...oldObj };
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] =
        obj[key].length > 100 ? obj[key].substring(0, 100) + "..." : obj[key];
    } else if (typeof obj[key] === "object") {
      obj[key] = truncateStrings(obj[key]); // Assign the result back to the property
    }
  }
  return obj;
}
