# Code Generation Plan

## 개요

6개 Unit을 순서대로 코드 생성합니다. Unit 1 (Shared)을 먼저 완성한 후 나머지를 진행합니다.

---

## Step 1: 프로젝트 초기화
- [ ] pnpm workspace 설정 (pnpm-workspace.yaml, root package.json)
- [ ] TypeScript 설정 (tsconfig.json base + 각 패키지별)
- [ ] ESLint + Prettier 설정
- [ ] .env.example 생성
- [ ] .gitignore 업데이트

## Step 2: Unit 1 — Shared Foundation
- [ ] packages/shared/package.json
- [ ] packages/shared/src/types/index.ts (도메인 타입, 상수)
- [ ] packages/shared/src/clients/dynamodb.ts (DynamoDBDocumentClient)
- [ ] packages/shared/src/clients/s3.ts (S3Client)
- [ ] packages/shared/src/clients/bedrock.ts (BedrockRuntimeClient)
- [ ] packages/shared/src/repository/review.repository.ts
- [ ] packages/shared/src/repository/cluster.repository.ts
- [ ] packages/shared/src/repository/action-brief.repository.ts
- [ ] packages/shared/src/repository/source-health.repository.ts
- [ ] packages/shared/src/utils/id.ts (generateReviewId, generateClusterId)
- [ ] packages/shared/src/utils/logger.ts (구조화 로그)
- [ ] packages/shared/src/index.ts (barrel export)

## Step 3: Unit 6 — Bedrock Prompts
- [ ] packages/shared/src/prompts/classification.ts (분류+요약 프롬프트)
- [ ] packages/shared/src/prompts/action-brief.ts (액션 브리프 프롬프트)
- [ ] fixtures/appstore-reviews-sample.json (샘플 5개)
- [ ] fixtures/googleplay-reviews-sample.json (샘플 5개)

## Step 4: Unit 2 — Ingest Pipeline
- [ ] packages/ingest/package.json
- [ ] packages/ingest/src/handler.ts (Lambda 핸들러)
- [ ] packages/ingest/src/connectors/appstore.ts (RSS connector)
- [ ] packages/ingest/src/connectors/googleplay.ts (Google Play connector)
- [ ] packages/ingest/src/services/ingest.service.ts (오케스트레이션)
- [ ] packages/ingest/src/services/classification.service.ts (Bedrock + fallback)
- [ ] packages/ingest/src/services/cluster.service.ts (클러스터 업데이트)

## Step 5: Unit 3 — API
- [ ] packages/api/package.json
- [ ] packages/api/src/handler.ts (Lambda 핸들러 + 라우팅)
- [ ] packages/api/src/routes/issues.ts
- [ ] packages/api/src/routes/actions.ts
- [ ] packages/api/src/routes/health.ts
- [ ] packages/api/src/middleware/validation.ts (zod)
- [ ] packages/api/src/middleware/security-headers.ts
- [ ] packages/api/src/middleware/error-handler.ts

## Step 6: Unit 4 — Dashboard UI
- [x] packages/dashboard/package.json (Vite + React + Tailwind + shadcn/ui)
- [x] packages/dashboard/vite.config.ts
- [x] packages/dashboard/tailwind.config.ts
- [x] packages/dashboard/src/main.tsx
- [x] packages/dashboard/src/App.tsx
- [x] packages/dashboard/src/components/CommandCenter.tsx
- [x] packages/dashboard/src/components/SourceHealthRail.tsx
- [x] packages/dashboard/src/components/RisingIssuesList.tsx
- [x] packages/dashboard/src/components/IssueDetail.tsx
- [x] packages/dashboard/src/components/EvidencePanel.tsx
- [x] packages/dashboard/src/components/ActionBriefPanel.tsx
- [x] packages/dashboard/src/components/ErrorScreen.tsx
- [x] packages/dashboard/src/hooks/usePolling.ts
- [x] packages/dashboard/src/lib/api.ts (fetch wrapper)
- [x] packages/dashboard/src/serve-handler.ts (Dashboard Lambda 핸들러)

## Step 7: Unit 5 — Infrastructure
- [x] infra/template.yaml (SAM template)
- [x] infra/samconfig.toml (배포 설정)

## Step 8: 테스트
- [ ] packages/shared/src/utils/id.test.ts (PBT: generateReviewId invariant)
- [ ] packages/ingest/src/services/classification.service.test.ts (PBT: fallbackClassify)
- [ ] packages/api/src/middleware/validation.test.ts
- [ ] vitest.config.ts (workspace root)

## Step 9: 빌드 스크립트
- [ ] root package.json scripts (build, test, deploy)
- [ ] 각 패키지 build 설정 (tsup 또는 esbuild)
