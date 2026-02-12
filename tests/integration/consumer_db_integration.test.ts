import * as amqp from "amqplib";
import { Channel, ChannelModel, GetMessage } from "amqplib";
import { settings } from "../../src/config/settings";
import { initDb, closeDb, getPool } from "../../src/models/db";
import { getProcessedReviewById } from "../../src/models/review_model";
import { setupQueues, startReviewConsumer } from "../../src/consumers/review_consumer";

const waitForMessage = async (
  channel: Channel,
  queue: string,
  timeoutMs = 10000,
  pollMs = 200
): Promise<GetMessage> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const message = await channel.get(queue, { noAck: false });
    if (message) {
      channel.ack(message);
      return message;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error("Timed out waiting for message");
};

const waitForNoMessage = async (
  channel: Channel,
  queue: string,
  timeoutMs = 1500,
  pollMs = 200
): Promise<void> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const message = await channel.get(queue, { noAck: false });
    if (message) {
      channel.ack(message);
      throw new Error("Expected no message but received one");
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
};

const shouldRunIntegration = process.env.RUN_INTEGRATION === "true";
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration("consumer integration", () => {
  let connection: ChannelModel | undefined;
  let channel: Channel | undefined;

  beforeAll(async () => {
    await initDb();
    connection = await amqp.connect({
      hostname: settings.queue.host,
      port: settings.queue.port,
      username: settings.queue.user,
      password: settings.queue.pass
    });
    channel = await connection.createChannel();
    await setupQueues(channel);
    await channel.purgeQueue(settings.queue.inputQueue);
    await channel.purgeQueue(settings.queue.outputQueue);
    await channel.purgeQueue(settings.queue.dlq);
    await channel.purgeQueue(`${settings.queue.inputQueue}.retry`);

    await getPool().query("DELETE FROM processed_reviews");
    await startReviewConsumer(channel);
  });

  afterAll(async () => {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    await closeDb();
  });

  it("processes a review and publishes processed event", async () => {
    const payload = {
      reviewId: "rv_integration_1",
      productId: "prod_1",
      userId: "user_1",
      rating: 5,
      comment: "This is excellent and I love it",
      timestamp: new Date().toISOString()
    };

    if (!channel) {
      throw new Error("Integration channel not initialized");
    }

    channel.sendToQueue(settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });

    const outputMessage = await waitForMessage(channel, settings.queue.outputQueue);
    const outputEvent = JSON.parse(outputMessage.content.toString("utf-8"));

    expect(outputEvent.reviewId).toBe(payload.reviewId);
    expect(outputEvent.sentiment).toBe("Positive");

    const record = await getProcessedReviewById(payload.reviewId);
    expect(record).not.toBeNull();
  });

  it("skips publishing on duplicate reviewId", async () => {
    const payload = {
      reviewId: "rv_integration_dupe",
      productId: "prod_2",
      userId: "user_2",
      rating: 4,
      comment: "Great product",
      timestamp: new Date().toISOString()
    };

    if (!channel) {
      throw new Error("Integration channel not initialized");
    }

    channel.sendToQueue(settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    await waitForMessage(channel, settings.queue.outputQueue);

    channel.sendToQueue(settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    await waitForNoMessage(channel, settings.queue.outputQueue);
  });
});
