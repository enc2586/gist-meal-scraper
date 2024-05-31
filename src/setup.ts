import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

export function init() {
  dotenv.config();

  const Env = z.object({
    OPENAI_API_KEY: z.string(),
  });

  try {
    Env.parse(process.env);
  } catch (error) {
    console.error("! Env variable not valid !");
    throw error;
  }

  return;
}

const DEBUG_LOG_FILE = path.resolve(__dirname, "../logs", "debug.log");

const DEBUG_CONSOLE_LOGGING_ENABLED =
  process.env.DEBUG_CONSOLE_LOGGING_ENABLED === "true";
const DEBUG_LOGGING_ENABLED = process.env.DEBUG_LOGGING_ENABLED === "true";

export function log(
  message: string,
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS" = "INFO"
) {
  const paddedLevel = `[${level}]`.padStart(9);
  if (DEBUG_LOGGING_ENABLED) {
    checkAndCreateLogFile();
    const logLine = `${new Date().toISOString()} ${paddedLevel} ${message}\n`;
    fs.appendFileSync(DEBUG_LOG_FILE, logLine);
  }
  if (DEBUG_CONSOLE_LOGGING_ENABLED) {
    console.log(`${paddedLevel} ${message}`);
  }
}

function checkAndCreateLogFile() {
  if (!fs.existsSync(DEBUG_LOG_FILE)) {
    fs.writeFileSync(DEBUG_LOG_FILE, "");
  }
}
