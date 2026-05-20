import { type ReviewEvent, generateReviewId, createLogger } from '@ffr/shared';
import { chromium } from 'playwright';

const logger = createLogger('appstore-connector');

const COUNTRIES = ['kr', 'us', 'jp', 'in', 'ph', 'gb', 'br', 'tr', 'id', 'th'];

export async function fetchAppStoreReviews(appId: string): Promise<ReviewEvent[]> {
  logger.info('launching browser for multi-country scraping', { countries: COUNTRIES.length });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  });

  const allReviews: ReviewEvent[] = [];
  const seen = new Set<string>();

  try {
    for (const country of COUNTRIES) {
      try {
        const page = await ctx.newPage();
        await page.goto(`https://apps.apple.com/${country}/app/id${appId}?see-all=reviews`, {
          waitUntil: 'networkidle',
          timeout: 20_000,
        });

        const raw = await page.evaluate(() => {
          const results: { title: string; body: string; author: string; date: string; rating: string }[] = [];
          const h3s = document.querySelectorAll('h3');
          for (const h3 of h3s) {
            const card = h3.closest('li') || h3.closest('[class*="card"]') || h3.parentElement?.parentElement;
            if (!card) continue;
            const title = h3.textContent?.trim() || '';
            const paragraphs = card.querySelectorAll('p');
            const bodyParts: string[] = [];
            paragraphs.forEach((p) => {
              const t = p.textContent?.trim();
              if (t && t !== title && !bodyParts.includes(t)) bodyParts.push(t);
            });
            const body = bodyParts.join(' ');
            const date = card.querySelector('time')?.getAttribute('datetime') || '';
            const author = card.querySelector('[class*="author"]')?.textContent?.trim() || '';
            const figLabel = card.querySelector('figure')?.getAttribute('aria-label') || '';
            if (title && body) results.push({ title, body, author, date, rating: figLabel });
          }
          return results;
        });

        for (const r of raw) {
          const dedupKey = r.date + r.author + r.title;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          allReviews.push({
            id: generateReviewId('appstore', dedupKey),
            source: 'appstore',
            sourceReviewId: dedupKey,
            sourceUrl: `https://apps.apple.com/${country}/app/id${appId}`,
            author: r.author || 'anonymous',
            rating: parseRating(r.rating),
            title: r.title,
            body: r.body,
            language: country === 'kr' ? 'ko' : country === 'jp' ? 'ja' : 'en',
            createdAt: r.date || new Date().toISOString(),
            collectedAt: new Date().toISOString(),
          });
        }

        logger.info('country done', { country, found: raw.length, total: allReviews.length });
        await page.close();
      } catch (err) {
        logger.info('country failed', { country, error: String(err) });
      }
    }
  } finally {
    await browser.close();
  }

  logger.info('fetched', { count: allReviews.length });
  return allReviews;
}

function parseRating(label: string): number | undefined {
  const match = label.match(/(\d)/);
  return match ? Number(match[1]) : undefined;
}
