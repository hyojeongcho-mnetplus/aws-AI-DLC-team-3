import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../clients/dynamodb.js';
import type { ClusterSnapshot } from '../types/index.js';

function toItem(cluster: ClusterSnapshot) {
  return {
    PK: `CLUSTER#${cluster.category}`,
    SK: `${cluster.severity}#${cluster.updatedAt}#${cluster.clusterId}`,
    ...cluster,
  };
}

export async function putCluster(cluster: ClusterSnapshot): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: toItem(cluster) }));
}

export async function getClusters(category?: string, limit = 20): Promise<ClusterSnapshot[]> {
  if (category) {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `CLUSTER#${category}` },
      Limit: limit,
    }));
    return (res.Items ?? []) as ClusterSnapshot[];
  }
  const categories = ['vote', 'ads', 'payment', 'live_video', 'other'];
  const results = await Promise.all(
    categories.map((cat) => getClusters(cat, limit)),
  );
  return results.flat().sort((a, b) => a.severity - b.severity).slice(0, limit);
}
