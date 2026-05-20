# Integration Test Instructions

## Purpose

Unit 간 상호작용을 검증합니다:
- Ingest → DynamoDB 저장 → API 조회
- API → Bedrock → Action Brief 생성
- Dashboard → API 폴링

## Setup: DynamoDB Local

### 1. Docker로 DynamoDB Local 실행

```bash
docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest
```

### 2. 테이블 생성

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
aws dynamodb create-table \
  --table-name FanFrictionRadar \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-2
```

## Integration Test Script

```bash
pnpm tsx scripts/local-test.ts
```

## Test Scenarios

### Scenario 1: Ingest → DynamoDB 저장

| 항목 | 내용 |
|------|------|
| **설명** | 리뷰 수집 후 DynamoDB에 정상 저장되는지 확인 |
| **Setup** | DynamoDB Local 실행 |
| **검증** | `REVIEW#appstore#YYYY-MM-DD` PK로 Query 시 아이템 반환 |
| **Expected** | 저장된 리뷰에 category, issueType, summary 필드 존재 |

### Scenario 2: 키워드 분류 정확성

| 항목 | 내용 |
|------|------|
| **설명** | fallback 분류기가 키워드 기반으로 올바른 카테고리 할당 |
| **Input** | "투표 버튼 안됨" → vote, "광고 너무 많음" → ads |
| **검증** | 분류 결과의 category 필드 확인 |
| **Expected** | 4개 카테고리 (vote, ads, payment, live_video) + other |

### Scenario 3: 클러스터 저장/조회 (API issues 시뮬레이션)

| 항목 | 내용 |
|------|------|
| **설명** | 클러스터 저장 후 `GET /api/issues` 패턴으로 조회 |
| **Setup** | `CLUSTER#{category}` PK로 PutItem |
| **검증** | Query 결과에 clusterId, title, severity 존재 |
| **Expected** | severity 기준 정렬 |

### Scenario 4: Action Brief 생성/조회

| 항목 | 내용 |
|------|------|
| **설명** | Action Brief 저장 후 최신 버전 조회 |
| **Setup** | `ACTION#{clusterId}` PK + `VERSION#{timestamp}` SK |
| **검증** | ScanIndexForward=false, Limit=1로 최신 조회 |
| **Expected** | owner, summary, suggestedAction 필드 존재 |

### Scenario 5: Source Health 업데이트

| 항목 | 내용 |
|------|------|
| **설명** | 수집 성공/실패 시 source health 상태 반영 |
| **Setup** | `SOURCE#{source}` PK + `STATUS#LATEST` SK |
| **검증** | GetItem으로 상태 확인 |
| **Expected** | status=LIVE, reviewCount 증가 |

## Expected Results

```
=== Fan Friction Radar 로컬 E2E 테스트 ===

[1. App Store RSS 수집 (mock)]     ✅ PASS
[2. DynamoDB 리뷰 저장 + 키워드 분류] ✅ PASS
[3. DynamoDB 리뷰 조회]             ✅ PASS
[4. 클러스터 저장]                   ✅ PASS
[5. 클러스터 조회 (GET /api/issues)] ✅ PASS
[6. Action Brief 저장]              ✅ PASS
[7. Action Brief 조회]              ✅ PASS
[8. Source Health 저장/조회]         ✅ PASS
```

## Cleanup

```bash
docker stop dynamodb-local && docker rm dynamodb-local
```

## 제한사항

- Bedrock 통합 테스트는 AWS 인증 필요 (로컬에서는 fallback 경로만 검증)
- Google Play 커넥터는 실제 API가 없어 항상 실패 (의도된 동작, source health에 BLOCKED 기록)
- App Store RSS는 앱에 따라 빈 응답 가능 → mock 데이터로 대체
