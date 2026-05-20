export const REVIEW_SOURCE = {
  APP_STORE: 'appstore',
  GOOGLE_PLAY: 'googleplay',
} as const;
export type ReviewSource = (typeof REVIEW_SOURCE)[keyof typeof REVIEW_SOURCE];

export const FEATURE_CATEGORY = {
  VOTE: 'vote',
  ADS: 'ads',
  PAYMENT: 'payment',
  LIVE_VIDEO: 'live_video',
  OTHER: 'other',
} as const;
export type FeatureCategory = (typeof FEATURE_CATEGORY)[keyof typeof FEATURE_CATEGORY];

export const ISSUE_TYPE = {
  ERROR: 'error',
  NOT_AN_ISSUE: 'not_an_issue',
  FEATURE_REQUEST: 'feature_request',
  SPEC_MISUNDERSTANDING: 'spec_misunderstanding',
} as const;
export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];

export const ERROR_LEVEL = { URGENT: 1, CAN_WAIT: 2, AWARENESS: 3 } as const;
export type ErrorLevel = (typeof ERROR_LEVEL)[keyof typeof ERROR_LEVEL];

export const SOURCE_STATUS = { LIVE: 'LIVE', BLOCKED: 'BLOCKED', STALE: 'STALE' } as const;
export type SourceStatus = (typeof SOURCE_STATUS)[keyof typeof SOURCE_STATUS];

export const AI_MODE = { DETERMINISTIC: 'DETERMINISTIC', AI_ENHANCED: 'AI_ENHANCED', NEEDS_REVIEW: 'NEEDS_REVIEW' } as const;
export type AiMode = (typeof AI_MODE)[keyof typeof AI_MODE];

export interface ReviewEvent {
  id: string;
  source: ReviewSource;
  sourceReviewId: string;
  sourceUrl: string;
  author: string;
  rating?: number;
  title?: string;
  body: string;
  language: string;
  appVersion?: string;
  createdAt: string;
  collectedAt: string;
}

export interface ProcessedReview extends ReviewEvent {
  category: FeatureCategory;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  summary: string;
  aiMode: AiMode;
  processedAt: string;
}

export interface ClusterSnapshot {
  clusterId: string;
  category: FeatureCategory;
  severity: number;
  title: string;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  reviewCount: number;
  recentReviewIds: string[];
  updatedAt: string;
}

export interface ActionBrief {
  clusterId: string;
  owner: string;
  summary: string;
  suggestedAction: string;
  evidence: string[];
  aiMode: AiMode;
  createdAt: string;
}

export interface SourceHealth {
  source: ReviewSource;
  status: SourceStatus;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  errorMessage?: string;
  reviewCount: number;
  updatedAt: string;
}
