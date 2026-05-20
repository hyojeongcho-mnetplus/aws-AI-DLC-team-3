import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../clients/dynamodb.js';
import type { ProcessedReview } from '../types/index.js';

const TTL_DAYS = 90;

function toItem(review: ProcessedReview) {
  const date = review.collectedAt.slice(0, 10);
  return {
    PK: `REVIEW#${review.source}#${date}`,
    SK: `${review.collectedAt}#${review.id}`,
    ...review,
    expiresAt: Math.floor(Date.now() / 1000) + TTL_DAYS * 86400,
  };
}

export async function putReviews(reviews: ProcessedReview[]): Promise<void> {
  const batches = [];
  for (let i = 0; i < reviews.length; i += 25) {
    batches.push(reviews.slice(i, i + 25));
  }
  for (const batch of batches) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch.map((r) => ({ PutRequest: { Item: toItem(r) } })),
      },
    }));
  }
}

export async function getReviewsBySourceAndDate(source: string, date: string): Promise<ProcessedReview[]> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `REVIEW#${source}#${date}` },
    ScanIndexForward: false,
  }));
  return (res.Items ?? []) as ProcessedReview[];
}
