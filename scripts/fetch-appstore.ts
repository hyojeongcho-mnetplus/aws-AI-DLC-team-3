/**
 * App Store 리뷰를 수집하여 S3 업로드 형태의 JSON 파일로 저장
 * 실행: npx tsx scripts/fetch-appstore.ts
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';

const APP_STORE_ID = process.env.APP_STORE_ID ?? '6443405421';
const COUNTRIES = ['kr', 'us', 'jp', 'in', 'ph', 'gb', 'br', 'tr', 'id', 'th'];

function generateReviewId(source: string, key: string): string {
  return createHash('sha256').update(`${source}:${key}`).digest('hex').slice(0, 16);
}

function parseRating(label: string): number | undefined {
  const match = label.match(/(\d)/);
  return match ? Number(match[1]) : undefined;
}

async function main() {
  console.log(`\n🍎 App Store 리뷰 수집 시작 (appId: ${APP_STORE_ID})\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  });

  const allReviews: any[] = [];
  const seen = new Set<string>();

  for (const country of COUNTRIES) {
    try {
      const page = await ctx.newPage();
      await page.goto(`https://apps.apple.com/${country}/app/id${APP_STORE_ID}?see-all=reviews`, {
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
          sourceUrl: `https://apps.apple.com/${country}/app/id${APP_STORE_ID}`,
          author: r.author || 'anonymous',
          rating: parseRating(r.rating),
          title: r.title,
          body: r.body,
          language: country === 'kr' ? 'ko' : country === 'jp' ? 'ja' : 'en',
          createdAt: r.date || new Date().toISOString(),
          collectedAt: new Date().toISOString(),
        });
      }

      console.log(`  [${country}] ${raw.length}건 수집 (누적: ${allReviews.length})`);
      await page.close();
    } catch (err) {
      console.log(`  [${country}] 실패: ${err}`);
    }
  }

  await browser.close();

  // S3 키 형식에 맞춰 파일 저장
  const date = new Date().toISOString().slice(0, 10);
  const outDir = `output/raw/appstore/${date}`;
  mkdirSync(outDir, { recursive: true });

  const filename = `${outDir}/${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(allReviews, null, 2));

  console.log(`\n✅ 완료: ${allReviews.length}건 → ${filename}`);
  console.log(`   S3 키: raw/appstore/${date}/${Date.now()}.json\n`);
}

main().catch(console.error);
