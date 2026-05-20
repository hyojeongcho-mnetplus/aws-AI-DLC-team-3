import { createHash } from 'node:crypto';

export function generateReviewId(source: string, sourceReviewId: string): string {
  return createHash('sha256').update(`${source}:${sourceReviewId}`).digest('hex').slice(0, 16);
}

export function generateClusterId(category: string, title: string): string {
  return createHash('sha256').update(`${category}:${title}`).digest('hex').slice(0, 12);
}
