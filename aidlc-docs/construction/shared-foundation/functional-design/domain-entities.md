# Unit 1: Shared Foundation — Domain Entities

## 상수 정의

```typescript
const REVIEW_SOURCE = {
  APP_STORE: 'appstore',
  GOOGLE_PLAY: 'googleplay',
} as const;
type ReviewSource = typeof REVIEW_SOURCE[keyof typeof REVIEW_SOURCE];

const FEATURE_CATEGORY = {
  VOTE: 'vote',
  ADS: 'ads',
  PAYMENT: 'payment',
  LIVE_VIDEO: 'live_video',
  OTHER: 'other',
} as const;
type FeatureCategory = typeof FEATURE_CATEGORY[keyof typeof FEATURE_CATEGORY];

const ISSUE_TYPE = {
  ERROR: 'error',
  NOT_AN_ISSUE: 'not_an_issue',
  FEATURE_REQUEST: 'feature_request',
  SPEC_MISUNDERSTANDING: 'spec_misunderstanding',
} as const;
type IssueType = typeof ISSUE_TYPE[keyof typeof ISSUE_TYPE];

const ERROR_LEVEL = {
  URGENT: 1,
  CAN_WAIT: 2,
  AWARENESS: 3,
} as const;
type ErrorLevel = typeof ERROR_LEVEL[keyof typeof ERROR_LEVEL];

const SOURCE_STATUS = {
  LIVE: 'LIVE',
  BLOCKED: 'BLOCKED',
  STALE: 'STALE',
} as const;
type SourceStatus = typeof SOURCE_STATUS[keyof typeof SOURCE_STATUS];

const AI_MODE = {
  DETERMINISTIC: 'DETERMINISTIC',
  AI_ENHANCED: 'AI_ENHANCED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;
type AiMode = typeof AI_MODE[keyof typeof AI_MODE];
```

## 도메인 엔티티

### ReviewEvent (수집된 원본 리뷰)

```typescript
interface ReviewEvent {
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
```

### ProcessedReview (Bedrock 처리 완료)

```typescript
interface ProcessedReview extends ReviewEvent {
  category: FeatureCategory;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  summary: string;
  aiMode: AiMode;
  processedAt: string;
}
```

### ClusterSnapshot (이슈 클러스터)

```typescript
interface ClusterSnapshot {
  clusterId: string;
  category: FeatureCategory;
  severity: number;          // 1(P1) ~ 4(P4)
  title: string;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  reviewCount: number;
  recentReviewIds: string[];
  updatedAt: string;
}
```

### ActionBrief (액션 브리프)

```typescript
interface ActionBrief {
  clusterId: string;
  owner: string;
  summary: string;
  suggestedAction: string;
  evidence: string[];        // review IDs
  aiMode: AiMode;
  createdAt: string;
}
```

### SourceHealth (소스 상태)

```typescript
interface SourceHealth {
  source: ReviewSource;
  status: SourceStatus;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  errorMessage?: string;
  reviewCount: number;
  updatedAt: string;
}
```

## DynamoDB Item Shapes

### Review Item

```typescript
interface ReviewItem {
  PK: `REVIEW#${ReviewSource}#${string}`;  // REVIEW#appstore#2026-05-20
  SK: `${string}#${string}`;               // <timestamp>#<id>
  ...ProcessedReview;
  expiresAt: number;                        // TTL (epoch seconds)
}
```

### Source Status Item

```typescript
interface SourceStatusItem {
  PK: `SOURCE#${ReviewSource}`;
  SK: 'STATUS#LATEST';
  ...SourceHealth;
}
```

### Cluster Item

```typescript
interface ClusterItem {
  PK: `CLUSTER#${FeatureCategory}`;
  SK: `${number}#${string}#${string}`;     // <severity>#<updatedAt>#<clusterId>
  ...ClusterSnapshot;
}
```

### Action Brief Item

```typescript
interface ActionBriefItem {
  PK: `ACTION#${string}`;                  // ACTION#<clusterId>
  SK: `VERSION#${string}`;                 // VERSION#<timestamp>
  ...ActionBrief;
}
```
