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

| 실패 지점 | 대응 |
|-----------|------|
| Connector (RSS/Play) | 에러 발생 + source health BLOCKED |
| S3 저장 | 로그 + 재시도 |
| Bedrock | keyword 기반 fallback 분류 |
| DynamoDB | 에러 발생 |
| API 조회 | 에러 응답 → UI에서 에러 화면 표시 |

---

## 상세 문서 참조

- [components.md](./components.md) — 컴포넌트 정의
- [component-methods.md](./component-methods.md) — 메서드 시그니처
- [services.md](./services.md) — 서비스 오케스트레이션
- [component-dependency.md](./component-dependency.md) — 의존성 및 통신 패턴
