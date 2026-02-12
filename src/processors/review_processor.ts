import { ProductReviewSubmitted } from "../types/events";
import { analyzeSentiment } from "./sentiment_analyzer";
import { insertProcessedReview } from "../models/review_model";

export interface ProcessingResult {
  processed: boolean;
  sentiment: string;
  processedTimestamp: string;
}

export const processReview = async (event: ProductReviewSubmitted): Promise<ProcessingResult> => {
  const sentiment = analyzeSentiment(event.comment);
  const processedTimestamp = new Date().toISOString();

  const inserted = await insertProcessedReview({
    reviewId: event.reviewId,
    productId: event.productId,
    userId: event.userId,
    rating: event.rating,
    comment: event.comment,
    sentiment,
    processedTimestamp
  });

  return {
    processed: inserted,
    sentiment,
    processedTimestamp
  };
};
