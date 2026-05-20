import { describe, it, expect } from 'vitest';
import { validateIssueFilters, validateClusterId, ValidationError } from './validation.js';

describe('validateIssueFilters', () => {
  it('빈 파라미터는 기본값 반환', () => {
    const result = validateIssueFilters({});
    expect(result.limit).toBe(20);
    expect(result.category).toBeUndefined();
  });

  it('유효한 category 통과', () => {
    const result = validateIssueFilters({ category: 'vote' });
    expect(result.category).toBe('vote');
  });

  it('유효한 issueType 통과', () => {
    const result = validateIssueFilters({ issueType: 'error' });
    expect(result.issueType).toBe('error');
  });

  it('유효한 errorLevel 통과', () => {
    const result = validateIssueFilters({ errorLevel: '1' });
    expect(result.errorLevel).toBe(1);
  });

  it('limit 범위 내 통과', () => {
    const result = validateIssueFilters({ limit: '50' });
    expect(result.limit).toBe(50);
  });

  it('잘못된 category는 ValidationError', () => {
    expect(() => validateIssueFilters({ category: 'invalid' })).toThrow(ValidationError);
  });

  it('잘못된 errorLevel은 ValidationError', () => {
    expect(() => validateIssueFilters({ errorLevel: '5' })).toThrow(ValidationError);
  });

  it('limit 초과는 ValidationError', () => {
    expect(() => validateIssueFilters({ limit: '200' })).toThrow(ValidationError);
  });
});

describe('validateClusterId', () => {
  it('유효한 12자 hex 통과', () => {
    expect(() => validateClusterId('abcdef123456')).not.toThrow();
  });

  it('길이 부족은 ValidationError', () => {
    expect(() => validateClusterId('abc')).toThrow(ValidationError);
  });

  it('비 hex 문자는 ValidationError', () => {
    expect(() => validateClusterId('zzzzzzzzzzzz')).toThrow(ValidationError);
  });

  it('길이 초과는 ValidationError', () => {
    expect(() => validateClusterId('abcdef1234567')).toThrow(ValidationError);
  });
});
