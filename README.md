# Product Review Sentiment MQ Service

A TypeScript service that consumes ProductReviewSubmitted events from RabbitMQ, performs a mock sentiment analysis, stores the enriched review in PostgreSQL, and publishes ReviewProcessed events. The service is designed for idempotent processing, retries with exponential backoff, and DLQ handling.

## Architecture Overview

- **Consumer**: Reads ProductReviewSubmitted events from the input queue.
- **Processor**: Validates, analyzes sentiment, and persists results.
- **Publisher**: Emits ReviewProcessed events to the output queue.
- **DLQ/Retry**: Failed messages are retried with exponential backoff and sent to a DLQ after max retries.

## Event Schemas

### ProductReviewSubmitted

```
{
  "reviewId": "rv_abc123",
  "productId": "prod_xyz456",
  "userId": "user_123",
  "rating": 5,
  "comment": "This product is amazing. I love it!",
  "timestamp": "2023-10-27T10:00:00Z"
}
```

### ReviewProcessed

```
{
  "reviewId": "rv_abc123",
  "sentiment": "Positive",
  "processedTimestamp": "2023-10-27T10:00:05Z"
}
```

## Idempotency Strategy

The database uses `review_id` as a primary key. Inserts use `ON CONFLICT DO NOTHING`, so reprocessing the same message will not create duplicates. When a duplicate is detected, the service logs and skips publishing a new ReviewProcessed event.

## Local Development

1. Copy environment variables:

```
cp .env.example .env
```

2. Start the stack:

```
docker-compose up --build
```

3. RabbitMQ management UI: http://localhost:15672 (guest/guest)

## Running Tests

Run unit tests:

```
npm run test:unit
```

Run integration tests with Docker services:

```
docker-compose up -d rabbitmq db
npm run test:integration
```

Or inside the app container:

```
docker-compose run --rm app npm run test
```

## Environment Variables

See [.env.example](.env.example) for required settings.

## Health Check

The service exposes `GET /health` on port `8080`.
