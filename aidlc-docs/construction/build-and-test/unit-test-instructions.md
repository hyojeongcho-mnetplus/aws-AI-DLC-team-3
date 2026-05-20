# Unit Test Execution

## Run All Unit Tests

```bash
pnpm test
```

## Test Configuration

Vitest workspace (`vitest.workspace.ts`)로 환경 분리:
- **node**: `packages/{shared,api,ingest}` — Node.js 환경
- **dashboard**: `packages/dashboard` — jsdom 환경 (React 컴포넌트)

## Test Files (10개)

| Package | File | Tests | 유형 |
|---------|------|-------|------|
| shared | `src/utils/id.test.ts` | 4 | PBT (fast-check) |
| shared | `src/prompts/prompts.test.ts` | 5 | Unit |
| ingest | `src/services/classification.service.test.ts` | 10 | PBT + Unit |
| api | `src/handler.test.ts` | 6 | Unit (mock) |
| api | `src/middleware/validation.test.ts` | 12 | Unit |
| dashboard | `src/components/ErrorScreen.test.tsx` | 2 | Component |
| dashboard | `src/components/RisingIssuesList.test.tsx` | 3 | Component |
| dashboard | `src/components/SourceHealthRail.test.tsx` | 2 | Component |
| dashboard | `src/hooks/usePolling.test.ts` | 4 | Hook (fake timers) |
| dashboard | `src/lib/api.test.ts` | 4 | Unit (fetch mock) |

## Expected Results

- **Total**: 52 tests
- **Passed**: 52
- **Failed**: 0
- **Duration**: ~1s (node) + ~15s (dashboard, jsdom 초기화)

## 개별 패키지 테스트

```bash
# shared만
pnpm --filter @ffr/shared test

# ingest만
pnpm --filter @ffr/ingest test

# api만
pnpm --filter @ffr/api test

# dashboard만
pnpm --filter @ffr/dashboard test
```

## PBT (Property-Based Testing) 참고

- `fast-check` 4.1.1 사용
- `id.test.ts`: ID 생성 함수의 결정론성 + 포맷 검증
- `classification.service.test.ts`: fallback 분류의 출력 유효성 + calcSeverity 범위 검증
- 기본 100회 반복 (shrinking 포함)

## Fix Failing Tests

1. `document is not defined` → vitest.workspace.ts에서 dashboard를 jsdom으로 설정 확인
2. `Invalid time value` (PBT) → `fc.date()` 대신 timestamp 범위 제한 사용
3. `infinite loop` (fake timers) → `vi.advanceTimersByTimeAsync()` 사용, `vi.runAllTimersAsync()` 금지 (setInterval 존재 시)
