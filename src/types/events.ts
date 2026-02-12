export interface ProductReviewSubmitted {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface ReviewProcessed {
  reviewId: string;
  sentiment: string;
  processedTimestamp: string;
}
