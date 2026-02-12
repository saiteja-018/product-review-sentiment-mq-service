const positiveKeywords = ["great", "love", "excellent", "amazing", "perfect", "fantastic"];
const negativeKeywords = ["bad", "hate", "poor", "terrible", "awful", "broken"];

export const analyzeSentiment = (comment: string): "Positive" | "Negative" | "Neutral" => {
  const text = comment.toLowerCase();

  if (positiveKeywords.some((keyword) => text.includes(keyword))) {
    return "Positive";
  }

  if (negativeKeywords.some((keyword) => text.includes(keyword))) {
    return "Negative";
  }

  return "Neutral";
};
