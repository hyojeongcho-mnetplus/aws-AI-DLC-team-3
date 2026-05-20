# Mnet Plus Fan Friction Radar

App Store와 Google Play의 공개 리뷰를 수집하여, 팬들이 겪는 가장 큰 마찰을 실시간 운영 이슈로 보여주는 AI 기반 커맨드 센터입니다.

## 아키텍처

```
App Store / Google Play
        │
        ▼
┌─────────────────┐     ┌──────────┐     ┌──────────────┐
│  Ingest Lambda  │────▶│  S3 Raw  │     │   Bedrock    │
│  (수집+분류)     │────▶│          │     │  (Claude 4)  │
└────────┬────────┘     └──────────┘     └──────┬───────┘
         │                                       │
         ▼                                       ▼
┌─────────────────┐     ┌──────────────────────────────┐
│    DynamoDB     │◀────│  분류 + 클러스터링 + 액션브리프  │
│ FanFrictionRadar│     └──────────────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   API Lambda    │◀────│ Dashboard Lambda  │
│  (REST API)     │     │  (React SPA 서빙)  │
└─────────────────┘     └──────────────────┘
```

## 프로젝트 구조

```
packages/
├── shared/       # 공유 타입, AWS 클라이언트, repository
├── ingest/       # 리뷰 수집 파이프라인 (App Store + Google Play)
├── api/          # REST API (issues, actions, health)
└── dashboard/    # React SPA 대시보드 (Vite + Tailwind)
infra/            # AWS SAM 인프라 (template.yaml)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Runtime | Node.js 22, TypeScript 5.8 |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | AWS Lambda, API Gateway |
| Database | DynamoDB (single-table) |
| Storage | S3 (원본 리뷰) |
| AI | Amazon Bedrock (Claude 4 Sonnet) |
| Scraping | Playwright + @sparticuz/chromium |
| IaC | AWS SAM |
| Monorepo | pnpm workspace |
| Test | Vitest, fast-check (PBT) |

## 시작하기

### 사전 요구사항

- Node.js 22+
- pnpm 10+
- AWS CLI (credentials 설정)
- Playwright Chromium (`npx playwright install chromium`)

### 설치

```bash
pnpm install
```

### 환경 변수

```bash
cp .env.example .env
# .env 파일에 실제 값 설정
```

| 변수 | 설명 |
|------|------|
| `DYNAMODB_TABLE_NAME` | DynamoDB 테이블명 |
| `S3_BUCKET_NAME` | S3 원본 리뷰 버킷 |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID |
| `APP_STORE_APP_ID` | App Store 숫자 ID (6443405421) |
| `GOOGLE_PLAY_PACKAGE` | Google Play 패키지명 (world.mnetplus) |

### 빌드

```bash
pnpm build
```

### 테스트

```bash
pnpm test
```

### 로컬 개발 (Dashboard)

```bash
pnpm --filter @ffr/dashboard dev
# http://localhost:5173 (mock 모드)
```

### 배포

```bash
cd infra
sam build
sam deploy --guided
```

## 주요 기능

- **리뷰 수집**: App Store 10개국 + Google Play에서 실제 리뷰 자동 수집
- **AI 분류**: 기능 분류(투표/광고/결제/라이브/기타), 이슈 타입, 에러 등급 자동 분류
- **클러스터링**: 유사 이슈를 그룹화하여 severity 기반 정렬
- **액션 브리프**: AI가 담당팀/요약/제안 액션을 자동 생성
- **대시보드**: severity-first 커맨드 센터 UI (30초 폴링, 다크 테마)

## 팀

AWS AI-DLC 해커톤 Team 3
