import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { fallbackClassify } from './classification.service.js';
import { calcSeverity } from './cluster.service.js';
import { FEATURE_CATEGORY, ISSUE_TYPE, AI_MODE, type ReviewEvent } from '@ffr/shared';

const validCategories = Object.values(FEATURE_CATEGORY);
const validIssueTypes = Object.values(ISSUE_TYPE);

const reviewArb: fc.Arbitrary<ReviewEvent> = fc.record({
  id: fc.string({ minLength: 16, maxLength: 16 }),
  source: fc.constantFrom('appstore' as const, 'googleplay' as const),
  sourceReviewId: fc.string({ minLength: 1, maxLength: 20 }),
  sourceUrl: fc.constant('https://example.com/review'),
  author: fc.string({ minLength: 1, maxLength: 30 }),
  rating: fc.integer({ min: 1, max: 5 }),
  body: fc.string({ minLength: 1, maxLength: 500 }),
  language: fc.constant('ko'),
  createdAt: fc.date().map((d) => d.toISOString()),
  collectedAt: fc.date().map((d) => d.toISOString()),
});

describe('fallbackClassify', () => {
  it('항상 유효한 category를 반환한다', () => {
    fc.assert(
      fc.property(fc.array(reviewArb, { minLength: 1, maxLength: 10 }), (reviews) => {
        const results = fallbackClassify(reviews);
        return results.every((r) => validCategories.includes(r.category));
      }),
    );
  });

  it('항상 유효한 issueType을 반환한다', () => {
    fc.assert(
      fc.property(fc.array(reviewArb, { minLength: 1, maxLength: 10 }), (reviews) => {
        const results = fallbackClassify(reviews);
        return results.every((r) => validIssueTypes.includes(r.issueType));
      }),
    );
  });

  it('입력 개수와 출력 개수가 동일하다', () => {
    fc.assert(
      fc.property(fc.array(reviewArb, { minLength: 0, maxLength: 20 }), (reviews) => {
        return fallbackClassify(reviews).length === reviews.length;
      }),
    );
  });

  it('aiMode는 항상 DETERMINISTIC이다', () => {
    fc.assert(
      fc.property(fc.array(reviewArb, { minLength: 1, maxLength: 5 }), (reviews) => {
        return fallbackClassify(reviews).every((r) => r.aiMode === AI_MODE.DETERMINISTIC);
      }),
    );
  });

  it('keyword가 포함되면 해당 category로 분류된다', () => {
    const keywordReview: ReviewEvent = {
      id: 'abc123def456gh78',
      source: 'appstore',
      sourceReviewId: '1',
      sourceUrl: 'https://example.com',
      author: 'user',
      body: '투표 기능이 안됩니다',
      language: 'ko',
      createdAt: '2026-01-01T00:00:00Z',
      collectedAt: '2026-01-01T00:00:00Z',
    };
    const [result] = fallbackClassify([keywordReview]);
    expect(result.category).toBe(FEATURE_CATEGORY.VOTE);
  });
});

describe('calcSeverity', () => {
  it('결과는 항상 1~4 범위이다', () => {
    fc.assert(
      fc.property(
        fc.record({
          issueType: fc.constantFrom(...validIssueTypes) as fc.Arbitrary<string>,
          errorLevel: fc.option(fc.constantFrom(1, 2, 3), { nil: undefined }),
          reviewCount: fc.integer({ min: 0, max: 1000 }),
        }),
        (input) => {
          const s = calcSeverity(input);
          return s >= 1 && s <= 4;
        },
      ),
    );
  });

  it('ERROR + level1 + 5건 이상 = P1', () => {
    expect(calcSeverity({ issueType: 'error', errorLevel: 1, reviewCount: 5 })).toBe(1);
    expect(calcSeverity({ issueType: 'error', errorLevel: 1, reviewCount: 100 })).toBe(1);
  });

  it('ERROR + level1 + 5건 미만 = P2', () => {
    expect(calcSeverity({ issueType: 'error', errorLevel: 1, reviewCount: 4 })).toBe(2);
  });

  it('ERROR + level2 = P3', () => {
    expect(calcSeverity({ issueType: 'error', errorLevel: 2, reviewCount: 10 })).toBe(3);
  });

  it('non-ERROR = P4', () => {
    expect(calcSeverity({ issueType: 'feature_request', errorLevel: 1, reviewCount: 100 })).toBe(4);
  });
});
