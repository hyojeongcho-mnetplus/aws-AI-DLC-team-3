# Build Instructions

## Prerequisites
- **Runtime**: Node.js 20.x
- **Package Manager**: pnpm 10.x
- **Build Tools**: tsup 8.4, Vite 6.3
- **System**: macOS / Linux

## Environment Variables

```bash
cp .env.example .env
```

필수 변수 (로컬 개발 시 기본값 사용 가능):
| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DYNAMODB_TABLE_NAME` | FanFrictionRadar | DynamoDB 테이블명 |
| `S3_BUCKET_NAME` | fan-friction-radar-raw | S3 버킷명 |
| `BEDROCK_MODEL_ID` | anthropic.claude-4-sonnet-20260514-v1:0 | Bedrock 모델 |
| `BEDROCK_REGION` | us-east-1 | Bedrock 리전 |
| `AWS_REGION` | ap-northeast-2 | 기본 AWS 리전 |

## Build Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build All Packages

```bash
pnpm -r build
```

빌드 순서 (pnpm이 의존성 기반으로 자동 결정):
1. `@ffr/shared` → tsup (ESM + DTS)
2. `@ffr/api` → tsup (CJS, Lambda용)
3. `@ffr/ingest` → tsup (CJS, Lambda용, `noExternal: [/@ffr\/.*/]`)
4. `@ffr/dashboard` → Vite (React SPA) + tsup (serve-handler)

### 3. Verify Build Success

```bash
ls packages/shared/dist/index.js     # 7.6 KB
ls packages/api/dist/handler.js      # 7.0 KB
ls packages/ingest/dist/handler.js   # 328 KB (AWS SDK 인라인)
ls packages/dashboard/dist/client/   # index.html + assets/
```

## Build Artifacts

| Package | Output | Format | 용도 |
|---------|--------|--------|------|
| shared | `dist/index.js` + `dist/index.d.ts` | ESM | 다른 패키지에서 import |
| api | `dist/handler.js` | CJS | Lambda 배포 |
| ingest | `dist/handler.js` + chunks | CJS | Lambda 배포 (self-contained) |
| dashboard | `dist/client/` + `dist/handler.js` | Static + CJS | S3/Lambda 배포 |

## Troubleshooting

### esbuild 빌드 스크립트 경고
```
Ignored build scripts: esbuild@0.25.12
```
**해결**: `pnpm approve-builds esbuild@0.25.12` 실행 후 선택

### shared 패키지 빌드 실패
**원인**: TypeScript 타입 에러
**해결**: `cd packages/shared && npx tsc --noEmit`으로 타입 확인

### ingest 번들 크기가 큰 경우
**원인**: `noExternal`로 AWS SDK가 인라인됨 (의도된 동작)
**참고**: Lambda 배포 시 외부 의존성 없이 단일 파일로 동작
