# Application Design — 통합 문서

## 아키텍처 개요

```
[EventBridge Scheduler] ──(자동)──┐
                                   ├──→ [Ingest Lambda] → S3 → Bedrock → DynamoDB
[API Gateway POST /api/ingest] ──(수동)──┘

[API Gateway GET /api/*] ──→ [API Lambda] → DynamoDB / Bedrock

[API Gateway GET /*] ──→ [Dashboard Lambda] → 정적 파일 서빙

[Dashboard UI (React SPA)] ──(polling)──→ API Lambda
```

---

## 컴포넌트 요약

| 컴포넌트 | 역할 | 런타임 |
|----------|------|--------|
| Ingest Lambda | 수집 + S3 저장 + Bedrock 처리 + DynamoDB 저장 | Lambda (Node.js) |
| API Lambda | 대시보드 데이터 조회 API | Lambda (Node.js) |
| Dashboard Lambda | 정적 페이지 서빙 | Lambda (Node.js) |
| Dashboard UI | 운영자 대시보드 SPA | Vite 8 + React |
| Shared Layer | 타입, 클라이언트, repository | 패키지 (공유) |

---

## 핵심 데이터 흐름

### 수집 파이프라인 (Ingest)
1. Connector가 App Store/Google Play에서 리뷰 수집
2. 중복 제거 (hash)
3. 원본을 S3에 저장 (`raw/<source>/<date>/`)
4. Bedrock으로 분류 + 요약 (기능 분류, 이슈 타입, 에러 등급, summary)
5. 처리 결과를 DynamoDB에 저장
6. Source health 업데이트

### 조회 (API)
1. Dashboard UI가 폴링으로 API 호출
2. API Lambda가 DynamoDB에서 clusters/issues 조회
3. 필터 적용 (기능 분류, 이슈 타입, 에러 등급)
4. Issue detail 요청 시 evidence + action brief 반환

---

## 에러 처리 전략

| 실패 지점 | 인지 방법 | 재시도 데이터 | 재시도 전략 | 전체 실패 시 |
|-----------|-----------|--------------|-------------|-------------|
| Connector (RSS/Play) | try-catch + CloudWatch 에러 로그 | 없음 (외부 API) | 최대 3회 exponential backoff | source health BLOCKED + CloudWatch Alarm |
| S3 저장 | SDK 에러 응답 + CloudWatch 메트릭 | 메모리에 보유 중인 원본 데이터 | 최대 3회 재시도 | 로그 남기고 파이프라인 계속 진행 (S3는 보조 저장소) |
| Bedrock 분류/요약 | SDK 에러 응답 + timeout | S3에 저장된 원본 데이터 | 최대 2회 재시도 | keyword 기반 fallback 분류 적용, AI mode = DETERMINISTIC |
| DynamoDB 저장 | SDK 에러 응답 | Bedrock 처리 완료된 결과 (메모리) | 최대 3회 exponential backoff | Lambda 에러 반환 → EventBridge 재실행 또는 DLQ |
| API 조회 | HTTP 에러 응답 | 없음 (읽기 전용) | 클라이언트 측 재시도 (폴링) | UI에서 에러 화면 표시 |

### 전체 파이프라인 실패 시

```
1. Ingest Lambda가 에러를 throw
2. EventBridge 트리거인 경우: Lambda 재시도 정책 (최대 2회)
3. 재시도 모두 실패 시: Dead Letter Queue (SQS)에 이벤트 저장
4. CloudWatch Alarm 발생 → 운영자 인지
5. 수동 재시도: API Gateway POST /api/ingest로 수동 트리거
6. DLQ에 쌓인 이벤트는 수동 확인 후 재처리
```

### 실패 인지 체계

```
Lambda 에러 → CloudWatch Logs (구조화 로그)
                → CloudWatch Metrics (에러 카운트)
                → CloudWatch Alarm (임계값 초과 시)
                → (Should-have) SNS → Slack 알림
```

---

## 상세 문서 참조

- [components.md](./components.md) — 컴포넌트 정의
- [component-methods.md](./component-methods.md) — 메서드 시그니처
- [services.md](./services.md) — 서비스 오케스트레이션
- [component-dependency.md](./component-dependency.md) — 의존성 및 통신 패턴
