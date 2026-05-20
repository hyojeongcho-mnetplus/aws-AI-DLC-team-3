import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../clients/dynamodb.js';
import type { ActionBrief } from '../types/index.js';

export async function putActionBrief(brief: ActionBrief): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `ACTION#${brief.clusterId}`,
      SK: `VERSION#${brief.createdAt}`,
      ...brief,
    },
  }));
}

export async function getLatestActionBrief(clusterId: string): Promise<ActionBrief | null> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `ACTION#${clusterId}` },
    ScanIndexForward: false,
    Limit: 1,
  }));
  return (res.Items?.[0] as ActionBrief) ?? null;
}
