import { type ReviewEvent, generateReviewId, createLogger } from '@ffr/shared';
import gplay from 'google-play-scraper';

const logger = createLogger('googleplay-connector');

const SORT_NEWEST = 2;

export async function fetchGooglePlayReviews(packageName: string): Promise<ReviewEvent[]> {
  try {
    const result = await gplay.reviews({
      appId: packageName,
      lang: 'ko',
      country: 'kr',
      num: 50,
      sort: SORT_NEWEST,
    });

    const reviews = result.data;
    logger.info('fetched', { count: reviews.length });

    return reviews.map((r) => ({
      id: generateReviewId('googleplay', r.id),
      source: 'googleplay' as const,
      sourceReviewId: r.id,
      sourceUrl: r.url ?? `https://play.google.com/store/apps/details?id=${packageName}&reviewId=${r.id}`,
      author: r.userName,
      rating: r.score,
      title: r.title ?? '',
      body: r.text,
      language: 'ko',
      createdAt: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      collectedAt: new Date().toISOString(),
    }));
  } catch (err) {
    logger.error('fetch failed', { error: String(err) });
    return [];
  }
}
