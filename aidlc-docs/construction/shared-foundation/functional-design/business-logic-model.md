# Unit 1: Shared Foundation — Business Logic Model

## Repository Layer

### ReviewRepository

```
putReviews(reviews: ProcessedReview[]) → void
  - 각 리뷰를 ReviewItem으로 변환
  - BatchWrite (25개씩)
  - 중복 시 무시 (ConditionExpression)

getReviewsBySourceAndDate(source, date) → ProcessedReview[]
  - Query: PK = REVIEW#<source>#<date>, SK begins_with 사용 안함 (전체)
  - ScanIndexForward: false (최신순)

getReviewsByCluster(reviewIds: string[]) → ProcessedReview[]
  - BatchGet으로 개별 조회
```

### ClusterRepository

```
putCluster(cluster: ClusterSnapshot) → void
  - ClusterItem으로 변환
  - 기존 동일 clusterId 있으면 업데이트

getClusters(category?: string, limit?: number) → ClusterSnapshot[]
  - category 있으면: Query PK = CLUSTER#<category>
  - category 없으면: 모든 카테고리 병렬 Query 후 severity 정렬
  - SK 오름차순 = severity 오름차순 (P1 먼저)

getClusterById(clusterId: string) → ClusterSnapshot | null
  - 모든 카테고리에서 clusterId로 필터 (또는 GSI 사용)
```

### ActionBriefRepository

```
putActionBrief(brief: ActionBrief) → void
  - ActionBriefItem으로 변환
  - 새 버전으로 저장

getLatestActionBrief(clusterId: string) → ActionBrief | null
  - Query: PK = ACTION#<clusterId>, ScanIndexForward: false, Limit: 1
```

### SourceHealthRepository

```
putSourceHealth(health: SourceHealth) → void
  - 덮어쓰기 (Put)

getSourceHealth(source: ReviewSource) → SourceHealth | null
  - GetItem: PK = SOURCE#<source>, SK = STATUS#LATEST

getAllSourceHealth() → SourceHealth[]
  - 각 source에 대해 GetItem (2개뿐이라 BatchGet)
```

## S3 Client

```
uploadRaw(source, date, data: RawReview[]) → string (S3 key)
  - Key: raw/<source>/<date>/<timestamp>.json
  - Body: JSON.stringify(data)
  - 반환: 저장된 S3 key
```

## Bedrock Client

```
invoke(prompt: string, reviews: ReviewEvent[]) → BedrockResponse
  - Model: Claude 4 Sonnet
  - Timeout: 30s
  - 응답 JSON 파싱 + 타입 검증
  - 실패 시 throw
```
