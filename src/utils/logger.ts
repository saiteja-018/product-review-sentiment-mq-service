type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const levelOrder: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

const getThreshold = (): number => {
  const raw = (process.env.LOG_LEVEL || "INFO").toUpperCase() as LogLevel;
  return levelOrder[raw] ?? levelOrder.INFO;
};

const shouldLog = (level: LogLevel): boolean => {
  return levelOrder[level] >= getThreshold();
};

const writeLog = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  console.log(JSON.stringify(payload));
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => writeLog("DEBUG", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => writeLog("INFO", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog("WARN", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog("ERROR", message, meta)
};
