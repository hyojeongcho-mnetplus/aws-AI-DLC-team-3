# Unit 2: Ingest Pipeline — Business Rules

## 트리거 판별

- EventBridge event: `source === 'aws.scheduler'` 또는 `detail-type` 존재
- API Gateway event: `httpMethod` 또는 `requestContext` 존재
- 둘 다 동일한 수집 로직 실행

## 수집 규칙

- App Store: Mnet Plus 앱 ID로 RSS Feed 호출
- Google Play: Mnet Plus 패키지명으로 호출
- 각 source 독립 실행 — 하나 실패해도 다른 source는 계속 진행
- 수집 순서: App Store → Google Play (순차)

## 재시도 규칙

| 단계 | 최대 재시도 | 간격 | 실패 시 |
|------|------------|------|---------|
| Connector HTTP | 3회 | exponential backoff (1s, 2s, 4s) | throw |
| S3 저장 | 3회 | 1s 고정 | 로그 후 계속 진행 |
| Bedrock 호출 | 2회 | 2s 고정 | fallback 분류 |
| DynamoDB 저장 | 3회 | exponential backoff (1s, 2s, 4s) | throw |

## 배치 처리 규칙

- Bedrock 호출: 최대 20개 리뷰/배치
- DynamoDB BatchWrite: 최대 25개 아이템/배치
- S3 저장: 한 번의 수집 결과를 1개 파일로 저장

## Severity 계산 규칙

```
IF issueType === ERROR:
  IF errorLevel === 1 AND reviewCount >= 5 → P1
  IF errorLevel === 1 AND reviewCount < 5  → P2
  IF errorLevel === 2                      → P3
  IF errorLevel === 3                      → P4
ELSE:
  → P4
```

## Source Health 업데이트 규칙

- 수집 성공: status = LIVE, lastSuccessAt = now(), reviewCount 갱신
- 수집 실패: status = BLOCKED, lastErrorAt = now(), errorMessage 기록
- 마지막 성공이 1시간 이상 전: status = STALE

## 데이터 무결성 규칙

- ReviewEvent.id는 불변 (source + sourceReviewId 기반 hash)
- 동일 id 재수집 시 무시 (idempotent)
- processedAt은 Bedrock/fallback 처리 완료 시점
- collectedAt은 connector에서 수집한 시점
