import {
  type ReviewEvent,
  type ReviewSource,
  type SourceHealth,
  SOURCE_STATUS,
  reviewRepo,
  sourceHealthRepo,
  uploadRaw,
  createLogger,
} from '@ffr/shared';
import { fetchAppStoreReviews } from '../connectors/appstore.js';
import { fetchGooglePlayReviews } from '../connectors/googleplay.js';
import { classifyReviews } from './classification.service.js';
import { updateClusters } from './cluster.service.js';

const logger = createLogger('ingest-service');

const APP_STORE_ID = process.env.APP_STORE_ID ?? '1536845339';
const GOOGLE_PLAY_PKG = process.env.GOOGLE_PLAY_PKG ?? 'com.cjenm.mnetplus';

interface IngestResult {
  source: ReviewSource;
  collected: number;
  newReviews: number;
  processedCount: number;
}

export async function runIngest(): Promise<IngestResult[]> {
  const sources: { source: ReviewSource; fetch: () => Promise<ReviewEvent[]> }[] = [
    { source: 'appstore', fetch: () => fetchAppStoreReviews(APP_STORE_ID) },
    { source: 'googleplay', fetch: () => fetchGooglePlayReviews(GOOGLE_PLAY_PKG) },
  ];

  const results: IngestResult[] = [];

  for (const { source, fetch } of sources) {
    try {
      const reviews = await fetch();
      const unique = dedup(reviews);
      const date = new Date().toISOString().slice(0, 10);

      await uploadRaw(source, date, unique);
      const processed = await classifyReviews(unique);
      await reviewRepo.putReviews(processed);
      await updateClusters(processed);
      await updateHealth(source, unique.length, true);

      results.push({ source, collected: reviews.length, newReviews: unique.length, processedCount: processed.length });
      logger.info('source done', { source, newReviews: unique.length });
    } catch (err) {
      logger.error('source failed', { source, error: String(err) });
      await updateHealth(source, 0, false, String(err));
      results.push({ source, collected: 0, newReviews: 0, processedCount: 0 });
    }
  }
  return results;
}

function dedup(reviews: ReviewEvent[]): ReviewEvent[] {
  const seen = new Set<string>();
  return reviews.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

async function updateHealth(source: ReviewSource, count: number, success: boolean, errorMsg?: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = await sourceHealthRepo.getSourceHealth(source);
  const health: SourceHealth = {
    source,
    status: success ? SOURCE_STATUS.LIVE : SOURCE_STATUS.BLOCKED,
    lastSuccessAt: success ? now : existing?.lastSuccessAt,
    lastErrorAt: success ? existing?.lastErrorAt : now,
    errorMessage: success ? undefined : errorMsg,
    reviewCount: (existing?.reviewCount ?? 0) + count,
    updatedAt: now,
  };
  await sourceHealthRepo.putSourceHealth(health);
}
