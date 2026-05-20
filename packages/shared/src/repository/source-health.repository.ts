import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../clients/dynamodb.js';
import type { SourceHealth, ReviewSource } from '../types/index.js';

export async function putSourceHealth(health: SourceHealth): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { PK: `SOURCE#${health.source}`, SK: 'STATUS#LATEST', ...health },
  }));
}

export async function getSourceHealth(source: ReviewSource): Promise<SourceHealth | null> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `SOURCE#${source}`, SK: 'STATUS#LATEST' },
  }));
  return (res.Item as SourceHealth) ?? null;
}

export async function getAllSourceHealth(): Promise<SourceHealth[]> {
  const results = await Promise.all([
    getSourceHealth('appstore'),
    getSourceHealth('googleplay'),
  ]);
  return results.filter((h): h is SourceHealth => h !== null);
}
