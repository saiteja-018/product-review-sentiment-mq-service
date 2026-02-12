import { parseProductReviewSubmitted, ValidationError } from "../../src/processors/validation";

describe("parseProductReviewSubmitted", () => {
  it("parses a valid event", () => {
    const event = parseProductReviewSubmitted({
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
    expect(() =>
      parseProductReviewSubmitted({
        reviewId: "rv_123",
        productId: "prod_1",
        userId: "user_1",
        rating: 7,
        comment: "Great product",
        timestamp: "2023-10-27T10:00:00Z"
      })
    ).toThrow(ValidationError);
  });
});
