import { describe, it, expect, vi, beforeEach } from "vitest";
import { handler } from "./handler.js";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { clusterRepo, reviewRepo } from "@ffr/shared";

vi.mock("@ffr/shared", () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  clusterRepo: { getClusters: vi.fn().mockResolvedValue([]) },
  actionBriefRepo: {
    getLatestActionBrief: vi.fn().mockResolvedValue(null),
    putActionBrief: vi.fn().mockResolvedValue(undefined),
  },
  reviewRepo: { getReviewsBySourceAndDate: vi.fn().mockResolvedValue([]) },
  sourceHealthRepo: { getAllSourceHealth: vi.fn().mockResolvedValue([]) },
  invokeModel: vi.fn().mockResolvedValue("{}"),
  buildActionBriefPrompt: vi.fn().mockReturnValue("prompt"),
  AI_MODE: {
    DETERMINISTIC: "DETERMINISTIC",
    AI_ENHANCED: "AI_ENHANCED",
    NEEDS_REVIEW: "NEEDS_REVIEW",
  },
  FEATURE_CATEGORY: {
    VOTE: "vote",
    ADS: "ads",
    PAYMENT: "payment",
    LIVE_VIDEO: "live_video",
    OTHER: "other",
  },
  ISSUE_TYPE: {
    ERROR: "error",
    NOT_AN_ISSUE: "not_an_issue",
    FEATURE_REQUEST: "feature_request",
    SPEC_MISUNDERSTANDING: "spec_misunderstanding",
  },
}));

const mockedClusterRepo = vi.mocked(clusterRepo);
const mockedReviewRepo = vi.mocked(reviewRepo);

function makeEvent(
  overrides: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/",
    pathParameters: null,
    queryStringParameters: null,
    body: null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as never,
    resource: "",
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedClusterRepo.getClusters.mockResolvedValue([]);
  mockedReviewRepo.getReviewsBySourceAndDate.mockResolvedValue([]);
});

describe("handler routing", () => {
  it("GET /api/issues → 200", async () => {
    const res = await handler(
      makeEvent({ httpMethod: "GET", path: "/api/issues" }),
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(res.body))).toBe(true);
  });

  it("GET /api/health → 200", async () => {
    const res = await handler(
      makeEvent({ httpMethod: "GET", path: "/api/health" }),
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(res.body))).toBe(true);
  });

  it("GET /api/issues/{clusterId} → 404 (not found)", async () => {
    const res = await handler(
      makeEvent({
        httpMethod: "GET",
        path: "/api/issues/abcdef123456",
        pathParameters: { clusterId: "abcdef123456" },
      }),
    );
    expect(res.statusCode).toBe(404);
  });

  it("GET /api/issues/{clusterId} returns evidence from non-appstore recent reviews", async () => {
    const clusterId = "abcdef123456";
    const cluster = {
      clusterId,
      category: "vote",
      severity: 1,
      title: "투표 장애",
      issueType: "error",
      errorLevel: 1,
      reviewCount: 1,
      recentReviewIds: ["gp-review-1"],
      updatedAt: "2026-05-20T04:00:00.000Z",
    };
    const review = {
      id: "gp-review-1",
      source: "googleplay",
      sourceReviewId: "raw-1",
      sourceUrl: "https://example.com/review/raw-1",
      author: "google-user",
      body: "투표가 안 됩니다",
      language: "ko",
      createdAt: "2026-05-19T10:00:00.000Z",
      collectedAt: "2026-05-19T10:05:00.000Z",
      category: "vote",
      issueType: "error",
      errorLevel: 1,
      summary: "투표 실패 리뷰",
      aiMode: "DETERMINISTIC",
      processedAt: "2026-05-19T10:06:00.000Z",
    };

    mockedClusterRepo.getClusters.mockResolvedValue([cluster as never]);
    mockedReviewRepo.getReviewsBySourceAndDate.mockImplementation(
      async (source, date) => {
        if (source === "googleplay" && date === "2026-05-19")
          return [review as never];
        return [];
      },
    );

    const res = await handler(
      makeEvent({
        httpMethod: "GET",
        path: `/api/issues/${clusterId}`,
        pathParameters: { clusterId },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).reviews).toEqual([review]);
    expect(mockedReviewRepo.getReviewsBySourceAndDate).toHaveBeenCalledWith(
      "googleplay",
      "2026-05-19",
    );
  });

  it("unknown route → 404", async () => {
    const res = await handler(
      makeEvent({ httpMethod: "GET", path: "/api/unknown" }),
    );
    expect(res.statusCode).toBe(404);
  });

  it("모든 응답에 security headers 포함", async () => {
    const res = await handler(
      makeEvent({ httpMethod: "GET", path: "/api/health" }),
    );
    expect(res.headers).toHaveProperty("X-Content-Type-Options", "nosniff");
    expect(res.headers).toHaveProperty("X-Frame-Options", "DENY");
    expect(res.headers).toHaveProperty("Strict-Transport-Security");
    expect(res.headers).toHaveProperty("Content-Security-Policy");
    expect(res.headers).toHaveProperty("Referrer-Policy");
  });

  it("validation 실패 → 400", async () => {
    const res = await handler(
      makeEvent({
        httpMethod: "GET",
        path: "/api/issues",
        queryStringParameters: { category: "invalid_category" },
      }),
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toHaveProperty("error", "Bad Request");
  });
});
