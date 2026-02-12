"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sentiment_analyzer_1 = require("../../src/processors/sentiment_analyzer");
describe("analyzeSentiment", () => {
    it("returns Positive when positive keywords are present", () => {
        expect((0, sentiment_analyzer_1.analyzeSentiment)("I love this product")).toBe("Positive");
    });
    it("returns Negative when negative keywords are present", () => {
        expect((0, sentiment_analyzer_1.analyzeSentiment)("This is bad and awful")).toBe("Negative");
    });
    it("returns Neutral when no keywords are present", () => {
        expect((0, sentiment_analyzer_1.analyzeSentiment)("It is a product.")).toBe("Neutral");
    });
});
