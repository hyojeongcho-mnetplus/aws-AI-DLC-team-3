import {
  type ProcessedReview,
  type ClusterSnapshot,
  ISSUE_TYPE,
  clusterRepo,
  generateClusterId,
  createLogger,
} from '@ffr/shared';

const logger = createLogger('cluster-service');

export async function updateClusters(reviews: ProcessedReview[]): Promise<void> {
  const grouped = groupByCategory(reviews);

  for (const [category, items] of Object.entries(grouped)) {
    const existing = await clusterRepo.getClusters(category, 100);
    const clusterMap = new Map<string, ClusterSnapshot>(existing.map((c) => [c.clusterId, c]));

    for (const review of items) {
      const clusterId = generateClusterId(category, review.issueType);
      const now = new Date().toISOString();

      const cluster = clusterMap.get(clusterId);
      if (cluster) {
        cluster.reviewCount += 1;
        cluster.recentReviewIds = [review.id, ...cluster.recentReviewIds].slice(0, 10);
        cluster.errorLevel = review.errorLevel ?? cluster.errorLevel;
        cluster.severity = calcSeverity(cluster);
        cluster.updatedAt = now;
        await clusterRepo.putCluster(cluster);
      } else {
        const newCluster: ClusterSnapshot = {
          clusterId,
          category: review.category,
          title: review.summary,
          issueType: review.issueType,
          errorLevel: review.errorLevel,
          reviewCount: 1,
          recentReviewIds: [review.id],
          severity: calcSeverity({ issueType: review.issueType, errorLevel: review.errorLevel, reviewCount: 1 }),
          updatedAt: now,
        };
        clusterMap.set(clusterId, newCluster);
        await clusterRepo.putCluster(newCluster);
      }
    }
  }
  logger.info('clusters updated', { reviewCount: reviews.length });
}

export function calcSeverity(input: { issueType: string; errorLevel?: number; reviewCount: number }): number {
  if (input.issueType !== ISSUE_TYPE.ERROR) return 4;
  if (input.errorLevel === 1 && input.reviewCount >= 5) return 1;
  if (input.errorLevel === 1) return 2;
  if (input.errorLevel === 2) return 3;
  return 4;
}

function groupByCategory(reviews: ProcessedReview[]): Record<string, ProcessedReview[]> {
  const map: Record<string, ProcessedReview[]> = {};
  for (const r of reviews) {
    (map[r.category] ??= []).push(r);
  }
  return map;
}
