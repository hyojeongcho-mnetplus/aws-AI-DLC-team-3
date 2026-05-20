import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { clusterRepo, actionBriefRepo, reviewRepo } from '@ffr/shared';
import { validateIssueFilters, validateClusterId } from '../middleware/validation.js';

export async function handleGetIssues(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const filters = validateIssueFilters(event.queryStringParameters ?? {});
  const clusters = await clusterRepo.getClusters(filters.category, filters.limit);

  const filtered = clusters.filter((c) => {
    if (filters.issueType && c.issueType !== filters.issueType) return false;
    if (filters.errorLevel && c.errorLevel !== filters.errorLevel) return false;
    return true;
  });

  return {
    statusCode: 200,
    body: JSON.stringify(filtered),
  };
}

export async function handleGetIssueDetail(clusterId: string): Promise<APIGatewayProxyResult> {
  validateClusterId(clusterId);

  const clusters = await clusterRepo.getClusters(undefined, 100);
  const cluster = clusters.find((c) => c.clusterId === clusterId);
  if (!cluster) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Not Found', message: 'Cluster not found', statusCode: 404 }) };
  }

  const [evidence, actionBrief] = await Promise.all([
    Promise.all(cluster.recentReviewIds.map((id) => reviewRepo.getReviewsBySourceAndDate('appstore', new Date().toISOString().slice(0, 10)))).then((r) => r.flat().filter((rev) => cluster.recentReviewIds.includes(rev.id))),
    actionBriefRepo.getLatestActionBrief(clusterId),
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({ cluster, reviews: evidence, actionBrief }),
  };
}
