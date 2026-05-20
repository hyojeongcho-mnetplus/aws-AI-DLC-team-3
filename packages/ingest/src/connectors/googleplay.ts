import { type ReviewEvent, generateReviewId, createLogger } from '@ffr/shared';

const logger = createLogger('googleplay-connector');

interface GooglePlayReview {
  reviewId: string;
  userName: string;
  score: number;
  text: string;
  date: string;
  url?: string;
}

export async function fetchGooglePlayReviews(packageName: string): Promise<ReviewEvent[]> {
  const url = `https://store.googleapis.com/reviews?id=${packageName}&num=50&hl=ko`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  const reviews: GooglePlayReview[] = json?.reviews ?? [];

  logger.info('fetched', { count: reviews.length });

  return reviews.map((r) => ({
    id: generateReviewId('googleplay', r.reviewId),
    source: 'googleplay' as const,
    sourceReviewId: r.reviewId,
    sourceUrl: r.url ?? `https://play.google.com/store/apps/details?id=${packageName}&reviewId=${r.reviewId}`,
    author: r.userName,
    rating: r.score,
    body: r.text,
    language: 'ko',
    createdAt: r.date,
    collectedAt: new Date().toISOString(),
  }));
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res;
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw new Error('unreachable');
}
