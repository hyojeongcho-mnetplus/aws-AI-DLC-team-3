# NFR Requirements

## 보안 (Security Extension — Full)

### SECURITY-01: Encryption at Rest/Transit
- DynamoDB: AWS managed encryption (기본 활성)
- S3: SSE-S3 (AES-256)
- 모든 통신: TLS 1.2+ (API Gateway 기본)

### SECURITY-02: Access Logging
- API Gateway: execution logging + access logging → CloudWatch

### SECURITY-03: Application Logging
- 모든 Lambda: 구조화 로그 (JSON)
- 필드: timestamp, requestId, level, message
- PII 로깅 금지 (리뷰 body 로그 시 truncate)

### SECURITY-04: HTTP Security Headers
- Content-Security-Policy: default-src 'self'
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

### SECURITY-05: Input Validation
- API Lambda: 모든 파라미터 zod schema 검증
- 문자열 최대 길이 제한
- clusterId: alphanumeric 12자 패턴

### SECURITY-06: Least Privilege IAM
- Unit 5 (Infra)에서 정의한 최소 권한 정책 적용
- 와일드카드 리소스 사용 금지

### SECURITY-07: Network
- Lambda: VPC 불필요 (AWS 서비스만 호출)
- S3: public access 전면 차단
- API Gateway: throttling 설정

### SECURITY-08: Access Control
- 현재: 퍼블릭 (해커톤)
- 설계: API Key 또는 Cognito 추가 가능한 구조
- CORS: 대시보드 도메인만 허용

### SECURITY-09: Hardening
- 에러 응답: 내부 상세 숨김 (generic message)
- 기본 credentials 없음
- 환경 변수로 설정 관리

### SECURITY-10: Supply Chain
- pnpm-lock.yaml 커밋
- 정확한 버전 고정 (^ 사용 안함)

### SECURITY-11: Secure Design
- 보안 로직 분리 (middleware)
- Rate limiting (API Gateway)

### SECURITY-12: Auth (해커톤 범위 외)
- N/A — 현재 인증 없음, 추후 추가 가능한 구조만 확보

### SECURITY-13: Integrity
- 외부 CDN 미사용 (self-hosted)
- 의존성 lock file 커밋

### SECURITY-14: Monitoring
- CloudWatch Logs 보존: 90일
- Lambda 에러 시 CloudWatch Alarm

### SECURITY-15: Error Handling
- 모든 외부 호출 try-catch
- Global error handler (Lambda 핸들러 최상위)
- 실패 시 deny (fail closed)

---

## 성능

| 항목 | 목표 |
|------|------|
| 대시보드 초기 로딩 | < 3초 |
| API 응답 시간 | < 500ms (p95) |
| Ingest 전체 실행 | < 60초 |
| DynamoDB 조회 | single-digit ms |
| 폴링 간격 | 30초 |

## 테스트

| 프레임워크 | 용도 |
|-----------|------|
| Vitest | 단위 테스트 |
| fast-check | PBT (Partial: 순수 함수, 직렬화) |

### PBT 대상 (Partial 적용)
- generateReviewId() — round-trip 불가, invariant (동일 입력 → 동일 출력)
- deduplicateReviews() — invariant (결과 ⊆ 입력, 중복 없음)
- fallbackClassify() — invariant (모든 출력이 valid category/issueType)
- severity 계산 — invariant (결과 1~4 범위)

### PBT 프레임워크
- fast-check (TypeScript/Vitest 통합)
- seed 로깅 활성화
- CI에서 실행

---

## 가용성

- Bedrock 실패 → fallback 분류 (서비스 계속 동작)
- Connector 실패 → source BLOCKED (다른 source는 계속)
- DynamoDB 실패 → Lambda 에러 → DLQ → 재시도
- Dashboard: 에러 화면 표시 (fallback 데이터 없음)
