import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './handler.js';
import type { APIGatewayProxyEvent } from 'aws-lambda';

vi.mock('@ffr/shared', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  clusterRepo: { getClusters: vi.fn().mockResolvedValue([]) },
  actionBriefRepo: { getLatestActionBrief: vi.fn().mockResolvedValue(null) },
  reviewRepo: { getReviewsBySourceAndDate: vi.fn().mockResolvedValue([]) },
  sourceHealthRepo: { getAllSourceHealth: vi.fn().mockResolvedValue([]) },
  invokeModel: vi.fn().mockResolvedValue('{}'),
  AI_MODE: { DETERMINISTIC: 'DETERMINISTIC', AI_ENHANCED: 'AI_ENHANCED', NEEDS_REVIEW: 'NEEDS_REVIEW' },
  FEATURE_CATEGORY: { VOTE: 'vote', ADS: 'ads', PAYMENT: 'payment', LIVE_VIDEO: 'live_video', OTHER: 'other' },
  ISSUE_TYPE: { ERROR: 'error', NOT_AN_ISSUE: 'not_an_issue', FEATURE_REQUEST: 'feature_request', SPEC_MISUNDERSTANDING: 'spec_misunderstanding' },
}));

function makeEvent(overrides: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    body: null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as never,
    resource: '',
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

describe('handler routing', () => {
  it('GET /api/issues → 200', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET', path: '/api/issues' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty('issues');
  });

  it('GET /api/health → 200', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET', path: '/api/health' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty('sources');
  });

  it('GET /api/issues/{clusterId} → 404 (not found)', async () => {
    const res = await handler(makeEvent({
      httpMethod: 'GET',
      path: '/api/issues/abcdef123456',
      pathParameters: { clusterId: 'abcdef123456' },
    }));
    expect(res.statusCode).toBe(404);
  });

  it('unknown route → 404', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET', path: '/api/unknown' }));
    expect(res.statusCode).toBe(404);
  });

  it('모든 응답에 security headers 포함', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET', path: '/api/health' }));
    expect(res.headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
    expect(res.headers).toHaveProperty('X-Frame-Options', 'DENY');
    expect(res.headers).toHaveProperty('Strict-Transport-Security');
    expect(res.headers).toHaveProperty('Content-Security-Policy');
    expect(res.headers).toHaveProperty('Referrer-Policy');
  });

  it('validation 실패 → 400', async () => {
    const res = await handler(makeEvent({
      httpMethod: 'GET',
      path: '/api/issues',
      queryStringParameters: { category: 'invalid_category' },
    }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toHaveProperty('error', 'Bad Request');
  });
});
