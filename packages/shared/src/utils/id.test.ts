import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateReviewId, generateClusterId } from './id.js';

describe('generateReviewId', () => {
  it('동일 입력 → 동일 출력 (deterministic)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (source, reviewId) => {
          const a = generateReviewId(source, reviewId);
          const b = generateReviewId(source, reviewId);
          expect(a).toBe(b);
        },
      ),
    );
  });

  it('항상 16자 hex 문자열 반환', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (source, reviewId) => {
          const id = generateReviewId(source, reviewId);
          expect(id).toHaveLength(16);
          expect(id).toMatch(/^[a-f0-9]{16}$/);
        },
      ),
    );
  });
});

describe('generateClusterId', () => {
  it('동일 입력 → 동일 출력 (deterministic)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (category, title) => {
          const a = generateClusterId(category, title);
          const b = generateClusterId(category, title);
          expect(a).toBe(b);
        },
      ),
    );
  });

  it('항상 12자 hex 문자열 반환', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (category, title) => {
          const id = generateClusterId(category, title);
          expect(id).toHaveLength(12);
          expect(id).toMatch(/^[a-f0-9]{12}$/);
        },
      ),
    );
  });
});
