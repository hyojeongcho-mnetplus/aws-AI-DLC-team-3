# Services

## 1. Ingest Service (Orchestration)

**역할**: 리뷰 수집 파이프라인 전체 오케스트레이션

**흐름**:
```
1. Connector에서 리뷰 수집
2. 중복 제거
3. S3에 원본 저장
4. Bedrock으로 분류/요약
5. DynamoDB에 처리 결과 저장
6. Source health 업데이트
```

**에러 처리**:
- Connector 실패 → 에러 발생 + source health BLOCKED
- S3 저장 실패 → 로그 후 재시도
- Bedrock 실패 → keyword 기반 fallback 분류
- DynamoDB 저장 실패 → 에러 발생

---

## 2. Classification Service

**역할**: 리뷰 분류 및 클러스터링

**흐름**:
```
1. Bedrock에 리뷰 배치 전송
2. 기능 분류 (투표/광고/결제/라이브·동영상/기타)
3. 이슈 타입 판별 (에러/이슈아님/기능제안/스펙오해)
4. 에러 등급 부여 (1/2/3)
5. Cluster snapshot 생성/업데이트
```

**Fallback**:
- Bedrock 실패 시 keyword 매칭으로 기능 분류만 수행

---

## 3. Query Service

**역할**: 대시보드 데이터 조회 오케스트레이션

**흐름**:
```
1. DynamoDB에서 cluster snapshots 조회 (severity 순)
2. 필터 적용 (기능 분류, 이슈 타입, 에러 등급)
3. Issue detail 조회 시 evidence + action brief 조합
```
