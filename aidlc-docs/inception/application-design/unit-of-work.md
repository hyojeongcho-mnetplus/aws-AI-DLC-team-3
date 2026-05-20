# Units of Work

## 분해 전략

4명 팀 병렬 작업을 위해 **6개 Unit**으로 분해합니다. Shared Layer는 Wave 1에서 먼저 완성 후 각 Unit이 병렬 진행합니다.

---

## Unit 1: Shared Foundation

**책임**: 모든 Lambda와 UI에서 공유하는 타입, 클라이언트, repository

**포함 범위**:
- 도메인 타입 (ReviewEvent, ProcessedReview, ClusterSnapshot, ActionBrief, SourceHealth)
- 상수 (REVIEW_SOURCE, FEATURE_CATEGORY, ISSUE_TYPE, ERROR_LEVEL)
- DynamoDB 클라이언트 + repository layer
- S3 클라이언트
- Bedrock 클라이언트
- 공통 에러 처리 유틸리티

**코드 위치**: `packages/shared/`

**우선순위**: 최우선 (다른 Unit의 의존성)

---

## Unit 2: Ingest Pipeline

**책임**: 리뷰 수집 → S3 저장 → Bedrock 처리 → DynamoDB 저장

**포함 범위**:
- Ingest Lambda 핸들러 (EventBridge + API Gateway 트리거)
- App Store RSS connector
- Google Play connector
- 중복 제거 로직
- S3 원본 저장
- Bedrock 분류/요약 호출
- DynamoDB 처리 결과 저장
- Source health 업데이트
- 에러 처리 + 재시도 로직

**코드 위치**: `packages/ingest/`

**의존**: Unit 1 (Shared Foundation), Unit 6 (Bedrock 프롬프트)

---

## Unit 3: API

**책임**: 대시보드에 데이터를 제공하는 REST API

**포함 범위**:
- API Lambda 핸들러 (라우팅)
- GET /api/issues — clusters 조회
- GET /api/issues/[clusterId] — issue detail
- POST /api/actions/[clusterId] — action brief 재생성
- GET /api/health — source health
- Input validation
- 에러 응답 처리

**코드 위치**: `packages/api/`

**의존**: Unit 1 (Shared Foundation)

---

## Unit 4: Dashboard UI

**책임**: 운영자용 severity-first 커맨드 센터 대시보드

**포함 범위**:
- Vite 8 + React SPA
- Tailwind CSS + shadcn/ui
- Source health rail
- Rising issues 목록
- Issue detail (evidence + action brief)
- 필터 (기능 분류, 이슈 타입, 에러 등급)
- 폴링 기반 자동 갱신
- 에러 화면
- Dashboard Lambda (정적 파일 서빙)

**코드 위치**: `packages/dashboard/`

**의존**: Unit 3 (API) — HTTP 통신

---

## Unit 5: Infrastructure

**책임**: AWS 인프라 구성 및 배포

**포함 범위**:
- Lambda 함수 3개 정의 (Ingest, API, Dashboard)
- API Gateway 설정 (라우팅 규칙)
- EventBridge Scheduler 설정 (주기적 수집)
- S3 버킷 생성 (원본 데이터)
- DynamoDB 테이블 생성 (FanFrictionRadar)
- IAM 역할/정책 (least privilege)
- CDK 또는 SAM 템플릿
- 배포 스크립트

**코드 위치**: `infra/`

**의존**: 없음 (병렬 진행 가능)

---

## Unit 6: Bedrock Prompt Engineering

**책임**: Bedrock 분류/요약 프롬프트 설계 및 검증

**포함 범위**:
- 분류 프롬프트 설계 (기능 분류, 이슈 타입, 에러 등급)
- 요약 프롬프트 설계 (issue summary, evidence synthesis)
- Action brief 생성 프롬프트 설계
- 실제 리뷰 샘플로 프롬프트 테스트/튜닝
- 기대 출력 형태 검증 (JSON schema)
- 테스트용 fixture 데이터 정리
- 프롬프트 버전 관리

**코드 위치**: `packages/shared/prompts/` + `fixtures/`

**의존**: 없음 (병렬 진행 가능, 결과물은 Unit 2에서 사용)

---

## 코드 구조 (Monorepo)

```
/
├── packages/
│   ├── shared/          ← Unit 1: 공유 타입, 클라이언트, repository
│   │   └── prompts/     ← Unit 6: Bedrock 프롬프트 정의
│   ├── ingest/          ← Unit 2: 수집 파이프라인 Lambda
│   ├── api/             ← Unit 3: REST API Lambda
│   └── dashboard/       ← Unit 4: Vite + React SPA + 서빙 Lambda
├── infra/               ← Unit 5: CDK/SAM 인프라 정의
├── fixtures/            ← Unit 6: 테스트용 리뷰 샘플 데이터
├── package.json         ← pnpm workspace root
└── pnpm-workspace.yaml
```

## 팀 배분 (4명)

| 사람 | Wave 1 | Wave 2 |
|------|--------|--------|
| A | Unit 1 (Shared) | Unit 2 (Ingest) |
| B | Unit 1 (Shared) | Unit 3 (API) |
| C | Unit 1 (Shared) | Unit 4 (Dashboard) |
| D | Unit 1 (Shared) | Unit 5 (Infra) + Unit 6 (Bedrock Prompt) |
