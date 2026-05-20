import {
  reviewRepo,
  type ClusterSnapshot,
  type ProcessedReview,
} from "@ffr/shared";

const EVIDENCE_SOURCES = ["appstore", "googleplay"] as const;
const DEFAULT_LOOKBACK_DAYS = 14;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseAnchorDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function evidenceDateWindow(
  anchor: string,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
) {
  const start = parseAnchorDate(anchor);
  return Array.from({ length: lookbackDays }, (_, offset) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() - offset);
    return toDateKey(date);
  });
}

export async function getEvidenceForCluster(
  cluster: ClusterSnapshot,
): Promise<ProcessedReview[]> {
  const wantedIds = new Set(cluster.recentReviewIds);
  if (!wantedIds.size) return [];

  const dates = evidenceDateWindow(cluster.updatedAt);
  const batches = await Promise.all(
    EVIDENCE_SOURCES.flatMap((source) =>
      dates.map((date) => reviewRepo.getReviewsBySourceAndDate(source, date)),
    ),
  );

  const byId = new Map<string, ProcessedReview>();
  for (const review of batches.flat()) {
    if (wantedIds.has(review.id)) byId.set(review.id, review);
  }

  return cluster.recentReviewIds
    .map((id) => byId.get(id))
    .filter((review): review is ProcessedReview => Boolean(review));
}
