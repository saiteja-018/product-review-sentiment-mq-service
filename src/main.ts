import * as amqp from "amqplib";
import express, { Request, Response } from "express";
import { settings } from "./config/settings";
import { logger } from "./utils/logger";
import { initDb } from "./models/db";
import { setupQueues, startReviewConsumer } from "./consumers/review_consumer";

const startHttpServer = () => {
  const app = express();
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.listen(settings.appPort, () => {
    logger.info("Health server started", { port: settings.appPort });
  });
};

const start = async (): Promise<void> => {
  await initDb();

  const connection = await amqp.connect({
    hostname: settings.queue.host,
    port: settings.queue.port,
    username: settings.queue.user,
    password: settings.queue.pass
  });

  const channel = await connection.createChannel();

  await setupQueues(channel);
  await startReviewConsumer(channel);

  startHttpServer();
  logger.info("Review consumer started", { queue: settings.queue.inputQueue });
};

start().catch((error) => {
  logger.error("Service failed to start", { error: (error as Error).message });
  process.exit(1);
});
