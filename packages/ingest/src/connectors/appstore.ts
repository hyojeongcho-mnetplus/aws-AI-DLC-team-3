import { type ReviewEvent, generateReviewId, createLogger } from '@ffr/shared';

const logger = createLogger('appstore-connector');

interface AppStoreEntry {
  id: { label: string };
  author: { name: { label: string } };
  'im:rating': { label: string };
  title: { label: string };
  content: { label: string };
  link: { attributes: { href: string } };
  updated: { label: string };
}

export async function fetchAppStoreReviews(appId: string): Promise<ReviewEvent[]> {
  const url = `https://itunes.apple.com/kr/rss/customerreviews/id=${appId}/json`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  const entries: AppStoreEntry[] = json?.feed?.entry ?? [];

  logger.info('fetched', { count: entries.length });

  return entries.map((e) => ({
    id: generateReviewId('appstore', e.id.label),
    source: 'appstore' as const,
    sourceReviewId: e.id.label,
    sourceUrl: e.link.attributes.href,
    author: e.author.name.label,
    rating: Number(e['im:rating'].label),
    title: e.title.label,
    body: e.content.label,
    language: 'ko',
    createdAt: e.updated.label,
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
