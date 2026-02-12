import { getPool } from "./db";

export interface ProcessedReviewRecord {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  sentiment: string;
  processedTimestamp: string;
}

export const insertProcessedReview = async (record: ProcessedReviewRecord): Promise<boolean> => {
  const result = await getPool().query(
    "INSERT INTO processed_reviews " +
      "(review_id, product_id, user_id, rating, comment, sentiment, processed_timestamp) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7) " +
      "ON CONFLICT (review_id) DO NOTHING " +
      "RETURNING review_id",
    [
      record.reviewId,
      record.productId,
      record.userId,
      record.rating,
      record.comment,
      record.sentiment,
      record.processedTimestamp
    ]
  );

  return (result.rowCount ?? 0) > 0;
};

export const getProcessedReviewById = async (reviewId: string): Promise<ProcessedReviewRecord | null> => {
  const result = await getPool().query(
    "SELECT review_id, product_id, user_id, rating, comment, sentiment, processed_timestamp " +
      "FROM processed_reviews WHERE review_id = $1",
    [reviewId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    reviewId: row.review_id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    sentiment: row.sentiment,
    processedTimestamp: row.processed_timestamp.toISOString()
  };
};
