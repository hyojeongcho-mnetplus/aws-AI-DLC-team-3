# Unit 1: Shared Foundation — Business Rules

## Repository Layer 규칙

### Review 저장
- PK는 `REVIEW#<source>#<yyyy-mm-dd>` 형식 (collectedAt 기준 날짜)
- SK는 `<timestamp>#<id>` 형식 (정렬 가능)
- TTL은 저장 시점 + 90일 (expiresAt)
- 동일 id의 리뷰가 이미 존재하면 저장하지 않음 (중복 방지)

### Cluster 저장
- PK는 `CLUSTER#<category>` 형식
- SK는 `<severity>#<updatedAt>#<clusterId>` — severity 오름차순 정렬 (P1이 먼저)
- 같은 clusterId가 이미 존재하면 업데이트 (reviewCount, updatedAt 갱신)

### Source Health 저장
- PK는 `SOURCE#<source>`, SK는 `STATUS#LATEST`
- 항상 덮어쓰기 (최신 상태만 유지)

### Action Brief 저장
- PK는 `ACTION#<clusterId>`, SK는 `VERSION#<timestamp>`
- 버전별로 누적 저장 (히스토리)
- 조회 시 최신 버전 반환 (SK 내림차순 limit 1)

## ID 생성 규칙

```typescript
// ReviewEvent ID: source + sourceReviewId의 SHA-256 hash (앞 16자)
generateReviewId(source: ReviewSource, sourceReviewId: string): string

// Cluster ID: category + title의 SHA-256 hash (앞 12자)
generateClusterId(category: FeatureCategory, title: string): string
```

## 중복 제거 규칙

- 동일 `id`(= hash(source + sourceReviewId))는 중복으로 판단
- 중복 리뷰는 무시 (저장하지 않음)
- 중복 체크는 DynamoDB 조건부 쓰기(ConditionExpression)로 처리

## S3 저장 규칙

- Prefix: `raw/<source>/<yyyy-mm-dd>/<collectedAt-timestamp>.json`
- 파일 형식: JSON array of raw review objects
- 원본 그대로 저장 (변환 없음)

## Bedrock Client 규칙

- Timeout: 30초
- 재시도: 최대 2회
- 실패 시 에러를 throw (fallback은 호출자가 처리)
- 응답은 반드시 JSON 파싱 후 타입 검증
