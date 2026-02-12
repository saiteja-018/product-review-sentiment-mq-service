"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../../src/processors/validation");
describe("parseProductReviewSubmitted", () => {
    it("parses a valid event", () => {
        const event = (0, validation_1.parseProductReviewSubmitted)({
            reviewId: "rv_123",
            productId: "prod_1",
            userId: "user_1",
            rating: 5,
            comment: "Great product",
            timestamp: "2023-10-27T10:00:00Z"
        });
        expect(event.reviewId).toBe("rv_123");
    });
    it("throws on invalid rating", () => {
        expect(() => (0, validation_1.parseProductReviewSubmitted)({
            reviewId: "rv_123",
            productId: "prod_1",
            userId: "user_1",
            rating: 7,
            comment: "Great product",
            timestamp: "2023-10-27T10:00:00Z"
        })).toThrow(validation_1.ValidationError);
    });
});
