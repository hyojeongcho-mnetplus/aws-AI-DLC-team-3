# Component Methods

## 1. Ingest Lambda

```typescript
// 메인 핸들러 — EventBridge/API Gateway 양쪽 트리거 지원
handler(event: EventBridgeEvent | APIGatewayEvent): Promise<IngestResult>

// App Store RSS Feed에서 리뷰 수집
fetchAppStoreReviews(appId: string): Promise<ReviewEvent[]>

// Google Play에서 리뷰 수집
fetchGooglePlayReviews(appId: string): Promise<ReviewEvent[]>

// 원본 데이터를 S3에 저장
saveRawToS3(reviews: RawReview[], source: ReviewSource): Promise<string>

// 중복 제거
deduplicateReviews(reviews: ReviewEvent[]): ReviewEvent[]

// Bedrock 분류/요약 처리
processWithBedrock(reviews: ReviewEvent[]): Promise<ProcessedReview[]>

// 처리 결과를 DynamoDB에 저장
saveProcessedToDynamoDB(processed: ProcessedReview[]): Promise<void>

// Source health 업데이트
updateSourceHealth(source: ReviewSource, status: SourceStatus): Promise<void>
```

## 2. API Lambda

```typescript
// 메인 핸들러 — API Gateway 라우팅
handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>

// Rising issues 조회
getIssues(filters?: IssueFilters): Promise<ClusterSnapshot[]>

// Issue detail + evidence 조회
getIssueDetail(clusterId: string): Promise<IssueDetail>

// Action brief 생성/조회
getOrCreateActionBrief(clusterId: string): Promise<ActionBrief>

// Source health 조회
getSourceHealth(): Promise<SourceHealth[]>
```

## 3. Shared Layer — Repository

```typescript
// Review events 저장
putReviewEvents(events: ProcessedReview[]): Promise<void>

// Source/day 기준 리뷰 조회
getReviewsBySourceAndDate(source: ReviewSource, date: string): Promise<ProcessedReview[]>

// Cluster snapshots 조회 (severity 순)
getClusters(category?: string): Promise<ClusterSnapshot[]>

// Cluster별 action brief 조회
getActionBrief(clusterId: string): Promise<ActionBrief | null>

// Action brief 저장
putActionBrief(brief: ActionBrief): Promise<void>

// Source health 조회/저장
getSourceHealth(source: ReviewSource): Promise<SourceHealth>
putSourceHealth(health: SourceHealth): Promise<void>
```

## 4. Shared Layer — Bedrock Client

```typescript
// 리뷰 배치를 분류 + 요약
classifyAndSummarize(reviews: ReviewEvent[]): Promise<ClassificationResult[]>

// Action brief 생성
generateActionBrief(cluster: ClusterSnapshot, evidence: ProcessedReview[]): Promise<ActionBrief>
```

## 5. Shared Layer — Types

```typescript
// 도메인 타입은 requirements.md의 ReviewEvent 스키마 참조
// 추가 타입:

interface ProcessedReview extends ReviewEvent {
  category: FeatureCategory;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  summary: string;
}

interface ClusterSnapshot {
  clusterId: string;
  category: FeatureCategory;
  severity: number; // 1~4
  title: string;
  reviewCount: number;
  updatedAt: string;
}

interface ActionBrief {
  clusterId: string;
  owner: string;
  summary: string;
  suggestedAction: string;
  evidence: ProcessedReview[];
  createdAt: string;
}

interface SourceHealth {
  source: ReviewSource;
  status: 'LIVE' | 'BLOCKED' | 'STALE';
  lastSuccessAt?: string;
  lastErrorAt?: string;
  errorMessage?: string;
}
```
