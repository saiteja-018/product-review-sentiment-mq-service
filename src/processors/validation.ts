import { ProductReviewSubmitted } from "../types/events";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const parseProductReviewSubmitted = (payload: unknown): ProductReviewSubmitted => {
  if (typeof payload !== "object" || payload === null) {
    throw new ValidationError("Payload must be an object");
  }

  const data = payload as Record<string, unknown>;
  const { reviewId, productId, userId, rating, comment, timestamp } = data;

  if (!isNonEmptyString(reviewId)) {
    throw new ValidationError("reviewId is required");
  }
  if (!isNonEmptyString(productId)) {
    throw new ValidationError("productId is required");
  }
  if (!isNonEmptyString(userId)) {
    throw new ValidationError("userId is required");
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError("rating must be an integer between 1 and 5");
  }
  if (!isNonEmptyString(comment)) {
    throw new ValidationError("comment is required");
  }
  if (!isNonEmptyString(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    throw new ValidationError("timestamp must be a valid ISO 8601 string");
  }

  return {
    reviewId,
    productId,
    userId,
    rating,
    comment,
    timestamp
  };
};
