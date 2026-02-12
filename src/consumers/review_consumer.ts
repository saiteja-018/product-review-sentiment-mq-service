import { Channel, ConsumeMessage } from "amqplib";
import { settings } from "../config/settings";
import { logger } from "../utils/logger";
import { parseProductReviewSubmitted, ValidationError } from "../processors/validation";
import { processReview } from "../processors/review_processor";
import { publishReviewProcessed, publishToDlq } from "../publishers/review_publisher";
import { ReviewProcessed } from "../types/events";

export const getRetryQueueName = (inputQueue: string): string => `${inputQueue}.retry`;

export const setupQueues = async (channel: Channel): Promise<void> => {
  await channel.assertQueue(settings.queue.inputQueue, { durable: true });
  await channel.assertQueue(settings.queue.outputQueue, { durable: true });
  await channel.assertQueue(settings.queue.dlq, { durable: true });

  await channel.assertQueue(getRetryQueueName(settings.queue.inputQueue), {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": settings.queue.inputQueue
    }
  });
};

const getRetryCount = (message: ConsumeMessage): number => {
  const headers = message.properties.headers || {};
  const raw = headers["x-retry-count"];
  return typeof raw === "number" ? raw : 0;
};

const scheduleRetry = async (channel: Channel, message: ConsumeMessage, retryCount: number, reason: string) => {
  const delayMs = settings.retryBaseMs * Math.pow(2, retryCount);
  const headers = {
    "x-retry-count": retryCount + 1,
    "x-error": reason
  };

  channel.sendToQueue(getRetryQueueName(settings.queue.inputQueue), message.content, {
    persistent: true,
    headers,
    expiration: delayMs.toString()
  });

  logger.warn("Scheduled retry", { retryCount: retryCount + 1, delayMs });
};

const sendToDlq = (channel: Channel, message: ConsumeMessage, reason: string) => {
  const headers = {
    "x-error": reason,
    "x-retry-count": getRetryCount(message)
  };

  publishToDlq(channel, settings.queue.dlq, message.content, headers);
  logger.error("Message sent to DLQ", { reason });
};

export const startReviewConsumer = async (channel: Channel): Promise<void> => {
  await channel.prefetch(settings.prefetchCount);

  await channel.consume(settings.queue.inputQueue, async (message) => {
    if (!message) {
      return;
    }

    const retryCount = getRetryCount(message);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.content.toString("utf-8"));
      } catch {
        throw new ValidationError("Invalid JSON payload");
      }

      const event = parseProductReviewSubmitted(parsed);

      const result = await processReview(event);
      if (!result.processed) {
        logger.info("Review already processed, skipping publish", { reviewId: event.reviewId });
        channel.ack(message);
        return;
      }

      const processedEvent: ReviewProcessed = {
        reviewId: event.reviewId,
        sentiment: result.sentiment,
        processedTimestamp: result.processedTimestamp
      };

      publishReviewProcessed(channel, settings.queue.outputQueue, processedEvent);
      logger.info("Processed review", { reviewId: event.reviewId, sentiment: result.sentiment });
      channel.ack(message);
    } catch (error) {
      const err = error as Error;
      const isValidationError = err instanceof ValidationError;

      if (!isValidationError && retryCount < settings.maxRetries) {
        await scheduleRetry(channel, message, retryCount, err.message);
        channel.ack(message);
        return;
      }

      sendToDlq(channel, message, err.message);
      channel.ack(message);
    }
  });
};
