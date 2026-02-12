"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = __importStar(require("amqplib"));
const settings_1 = require("../../src/config/settings");
const db_1 = require("../../src/models/db");
const review_model_1 = require("../../src/models/review_model");
const review_consumer_1 = require("../../src/consumers/review_consumer");
const waitForMessage = async (channel, queue, timeoutMs = 10000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Timed out waiting for message")), timeoutMs);
        channel.consume(queue, (message) => {
            if (message) {
                clearTimeout(timer);
                channel.ack(message);
                resolve(message);
            }
        }, { noAck: false });
    });
};
const waitForNoMessage = async (channel, queue, delayMs = 1500) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const message = await channel.get(queue, { noAck: false });
    if (message) {
        channel.ack(message);
        throw new Error("Expected no message but received one");
    }
};
describe("consumer integration", () => {
    let connection;
    let channel;
    beforeAll(async () => {
        await (0, db_1.initDb)();
        connection = await amqp.connect({
            hostname: settings_1.settings.queue.host,
            port: settings_1.settings.queue.port,
            username: settings_1.settings.queue.user,
            password: settings_1.settings.queue.pass
        });
        channel = await connection.createChannel();
        await (0, review_consumer_1.setupQueues)(channel);
        await channel.purgeQueue(settings_1.settings.queue.inputQueue);
        await channel.purgeQueue(settings_1.settings.queue.outputQueue);
        await channel.purgeQueue(settings_1.settings.queue.dlq);
        await channel.purgeQueue(`${settings_1.settings.queue.inputQueue}.retry`);
        await (0, db_1.getPool)().query("DELETE FROM processed_reviews");
        await (0, review_consumer_1.startReviewConsumer)(channel);
    });
    afterAll(async () => {
        await channel.close();
        await connection.close();
        await (0, db_1.closeDb)();
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
        channel.sendToQueue(settings_1.settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });
        const outputMessage = await waitForMessage(channel, settings_1.settings.queue.outputQueue);
        const outputEvent = JSON.parse(outputMessage.content.toString("utf-8"));
        expect(outputEvent.reviewId).toBe(payload.reviewId);
        expect(outputEvent.sentiment).toBe("Positive");
        const record = await (0, review_model_1.getProcessedReviewById)(payload.reviewId);
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
        channel.sendToQueue(settings_1.settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });
        await waitForMessage(channel, settings_1.settings.queue.outputQueue);
        channel.sendToQueue(settings_1.settings.queue.inputQueue, Buffer.from(JSON.stringify(payload)), { persistent: true });
        await waitForNoMessage(channel, settings_1.settings.queue.outputQueue);
    });
});
