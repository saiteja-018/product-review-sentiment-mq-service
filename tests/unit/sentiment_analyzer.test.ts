import { analyzeSentiment } from "../../src/processors/sentiment_analyzer";

describe("analyzeSentiment", () => {
  it("returns Positive when positive keywords are present", () => {
    expect(analyzeSentiment("I love this product")).toBe("Positive");
  });

  it("returns Negative when negative keywords are present", () => {
    expect(analyzeSentiment("This is bad and awful")).toBe("Negative");
  });

  it("returns Neutral when no keywords are present", () => {
    expect(analyzeSentiment("It is a product.")).toBe("Neutral");
  });
});
