import { Channel } from "amqplib";
import { ReviewProcessed } from "../types/events";

export const publishReviewProcessed = (channel: Channel, queue: string, event: ReviewProcessed): boolean => {
  const payload = Buffer.from(JSON.stringify(event));
  return channel.sendToQueue(queue, payload, { persistent: true });
};

export const publishToDlq = (channel: Channel, queue: string, payload: Buffer, headers: Record<string, unknown>): boolean => {
  return channel.sendToQueue(queue, payload, { persistent: true, headers });
};
