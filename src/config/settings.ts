import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const toInt = (value: string, key: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${key}: ${value}`);
  }
  return parsed;
};

export const settings = {
  queue: {
    host: requireEnv("QUEUE_HOST", "localhost"),
    port: toInt(requireEnv("QUEUE_PORT", "5672"), "QUEUE_PORT"),
    user: requireEnv("QUEUE_USER", "guest"),
    pass: requireEnv("QUEUE_PASS", "guest"),
    inputQueue: requireEnv("INPUT_QUEUE_NAME", "product_review_submitted_queue"),
    outputQueue: requireEnv("OUTPUT_QUEUE_NAME", "review_processed_queue"),
    dlq: requireEnv("DLQ_NAME", "product_review_dlq")
  },
  db: {
    host: requireEnv("DB_HOST", "localhost"),
    port: toInt(requireEnv("DB_PORT", "5432"), "DB_PORT"),
    user: requireEnv("DB_USER", "user"),
    password: requireEnv("DB_PASSWORD", "password"),
    name: requireEnv("DB_NAME", "review_db")
  },
  logLevel: requireEnv("LOG_LEVEL", "INFO"),
  maxRetries: toInt(requireEnv("MAX_RETRIES", "3"), "MAX_RETRIES"),
  retryBaseMs: toInt(requireEnv("RETRY_BASE_MS", "1000"), "RETRY_BASE_MS"),
  prefetchCount: toInt(requireEnv("PREFETCH_COUNT", "5"), "PREFETCH_COUNT"),
  appPort: toInt(requireEnv("APP_PORT", "8080"), "APP_PORT")
};
