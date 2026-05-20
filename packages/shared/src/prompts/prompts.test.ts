import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildClassificationPrompt } from './classification.js';
import { buildClusterTitlePrompt } from './cluster-title.js';
import type { ReviewEvent, ProcessedReview } from '../types/index.js';

const reviewEventArb = fc.record({
  id: fc.string({ minLength: 16, maxLength: 16, unit: 'grapheme' }).map((s) => s.replace(/[^a-f0-9]/g, 'a').slice(0, 16).padEnd(16, '0')),
  source: fc.constantFrom('appstore' as const, 'googleplay' as const),
  sourceReviewId: fc.string({ minLength: 1 }),
  sourceUrl: fc.constant('https://example.com/review'),
  author: fc.string({ minLength: 1 }),
  rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  title: fc.option(fc.string(), { nil: undefined }),
  body: fc.string({ minLength: 1, maxLength: 200 }),
  language: fc.constantFrom('ko', 'en'),
  appVersion: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.constant(new Date().toISOString()),
  collectedAt: fc.constant(new Date().toISOString()),
});

const processedReviewArb: fc.Arbitrary<ProcessedReview> = fc.record({
  id: fc.string({ minLength: 16, maxLength: 16, unit: 'grapheme' }).map((s) => s.replace(/[^a-f0-9]/g, 'a').slice(0, 16).padEnd(16, '0')),
  source: fc.constantFrom('appstore' as const, 'googleplay' as const),
  sourceReviewId: fc.string({ minLength: 1 }),
  sourceUrl: fc.constant('https://example.com/review'),
  author: fc.string({ minLength: 1 }),
  rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  title: fc.option(fc.string(), { nil: undefined }),
  body: fc.string({ minLength: 1, maxLength: 200 }),
  language: fc.constantFrom('ko', 'en'),
  appVersion: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.constant(new Date().toISOString()),
  collectedAt: fc.constant(new Date().toISOString()),
  category: fc.constantFrom('vote' as const, 'ads' as const, 'payment' as const, 'live_video' as const, 'other' as const),
  issueType: fc.constantFrom('error' as const, 'not_an_issue' as const, 'feature_request' as const, 'spec_misunderstanding' as const),
  errorLevel: fc.option(fc.constantFrom(1 as const, 2 as const, 3 as const), { nil: undefined }),
  summary: fc.string({ minLength: 1, maxLength: 30 }),
  aiMode: fc.constantFrom('AI_ENHANCED' as const, 'DETERMINISTIC' as const, 'NEEDS_REVIEW' as const),
  processedAt: fc.constant(new Date().toISOString()),
}) as fc.Arbitrary<ProcessedReview>;

describe('buildClassificationPrompt', () => {
  it('동일 입력 → 동일 출력 (deterministic)', () => {
    fc.assert(
      fc.property(
        fc.array(reviewEventArb, { minLength: 1, maxLength: 5 }),
        (reviews) => {
          const a = buildClassificationPrompt(reviews as ReviewEvent[]);
          const b = buildClassificationPrompt(reviews as ReviewEvent[]);
          expect(a).toBe(b);
        },
      ),
    );
  });

  it('출력에 필수 키워드 포함 (category, issueType, source 정보)', () => {
    fc.assert(
      fc.property(
        fc.array(reviewEventArb, { minLength: 1, maxLength: 3 }),
        (reviews) => {
          const result = buildClassificationPrompt(reviews as ReviewEvent[]);
          expect(result).toContain('category');
          expect(result).toContain('issueType');
          expect(result).toContain('appstore');
          expect(result).toContain('googleplay');
          expect(result).toContain('객관성');
        },
      ),
    );
  });

  it('빈 배열 입력 시 에러', () => {
    expect(() => buildClassificationPrompt([])).toThrow();
  });
});

describe('buildClusterTitlePrompt', () => {
  it('동일 입력 → 동일 출력 (deterministic)', () => {
    fc.assert(
      fc.property(
        fc.array(processedReviewArb, { minLength: 1, maxLength: 3 }),
        (reviews) => {
          const a = buildClusterTitlePrompt(reviews as ProcessedReview[]);
          const b = buildClusterTitlePrompt(reviews as ProcessedReview[]);
          expect(a).toBe(b);
        },
      ),
    );
  });

  it('빈 배열 입력 시 에러', () => {
    expect(() => buildClusterTitlePrompt([])).toThrow();
  });
});
