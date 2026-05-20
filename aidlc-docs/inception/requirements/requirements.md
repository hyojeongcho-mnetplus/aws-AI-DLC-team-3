# Mnet Plus Fan Friction Radar - 요구사항 문서

## Intent Analysis Summary

| 항목 | 내용 |
|------|------|
| **User Request** | Mnet Plus Fan Friction Radar 구현 - AI 기반 팬 프릭션 커맨드 센터 |
| **Request Type** | New Project (Greenfield) |
| **Scope** | Multiple Components (connectors, API, classifier, Bedrock enhancer, UI) |
| **Complexity** | Complex |
| **Requirements Depth** | Standard |

---

## 1. 프로젝트 개요

App Store/Google Play 공개 리뷰를 수집하여 팬들이 겪는 마찰을 실시간 운영 이슈로 보여주는 AI 기반 커맨드 센터.

**핵심 파이프라인:**
```
앱스토어/구글플레이 리뷰 → S3 원본 저장 → Bedrock 분류 및 요약(deterministic) → DynamoDB 저장 → 운영자 대시보드
```

**데모 앵커 이슈:** Ads blocking vote completion

---

## 2. 기술 스택 결정사항

| 항목 | 결정 |
|------|------|
| Framework | Vite 8 (Rolldown) + React |
| Package Manager | pnpm |
| Raw Storage | S3 (원본 리뷰 데이터) |
| DynamoDB 접근 | AWS SDK v3 DynamoDBDocumentClient 직접 사용 |
| DynamoDB 역할 | Bedrock 처리 완료된 결과(분류/요약)만 저장 |
| Bedrock 모델 | Claude 4 Sonnet |
| Bedrock 역할 | 분류 + 요약 + 액션 브리프 통합 처리 (deterministic) |
| App Store 수집 | RSS Feed primary + seed fallback (권장안 적용) |
| 배포 (UI) | S3 + CloudFront 정적 호스팅 또는 Amplify Hosting |
| 배포 (API) | AWS Lambda + API Gateway |
| DynamoDB 환경 | AWS 실제 DynamoDB (팀 계정) |
| UI | Tailwind CSS + shadcn/ui |
| 테스트 | Vitest |
| 실시간 갱신 | 폴링 (일정 간격 자동 갱신) |
| PBT 프레임워크 | fast-check (Partial 적용 — 순수 함수, 직렬화 round-trip만) |

---

## 3. Functional Requirements

### FR-01: 리뷰 수집 (Connectors)

- **FR-01.1**: App Store RSS Feed에서 Mnet Plus 리뷰를 수집한다 (primary)
- **FR-01.2**: Google Play에서 리뷰를 수집한다 (replay/live)
- **FR-01.3**: RSS Feed 실패 시 seed 데이터로 fallback한다
  - **Seed 데이터 정의**: 사전에 App Store/Google Play에서 수집해둔 리뷰 JSON 파일 (프로젝트 내 `fixtures/` 디렉토리에 위치). iOS 535개, Google Play 1,479개 샘플을 포함하며, 실제 수집 API와 동일한 review event 형태로 정규화되어 있음. 외부 API 장애 시 이 파일을 읽어 파이프라인을 정상 동작시킴.
- **FR-01.4**: 중복 리뷰를 hash 기반으로 제거한다
- **FR-01.5**: 수집된 리뷰를 정규화된 review event 형태로 변환한다
- **FR-01.6**: 원본 리뷰 데이터를 S3에 저장한다 (raw data lake)

#### Review Event 스키마

수집된 리뷰는 아래 형태로 정규화된다:

```typescript
interface ReviewEvent {
  id: string;              // hash(source + sourceReviewId)로 생성된 고유 ID
  source: 'appstore' | 'googleplay';  // 출처
  sourceReviewId: string;  // 원본 플랫폼의 리뷰 ID
  sourceUrl: string;       // 원본 리뷰 링크
  author: string;          // 리뷰 작성자 ID/닉네임
  rating: number;          // 별점 (1~5)
  title?: string;          // 리뷰 제목 (App Store만 해당)
  body: string;            // 리뷰 본문 (원본 description)
  language: string;        // 리뷰 언어 (ko, en 등)
  appVersion?: string;     // 앱 버전
  createdAt: string;       // 리뷰 등록 시간 (ISO 8601)
  collectedAt: string;     // 수집 시간 (ISO 8601)
}
```

### FR-02: 원본 데이터 저장 (S3)

- **FR-02.1**: 수집된 원본 리뷰를 S3 버킷에 저장한다
- **FR-02.2**: source/date 기반 prefix 구조로 저장한다 (예: `raw/appstore/2026-05-20/`, `raw/googleplay/2026-05-20/`)
- **FR-02.3**: 원본 데이터는 변경 없이 그대로 보존한다
- **FR-02.4**: S3 저장 완료 후 Bedrock 처리 파이프라인을 트리거한다

### FR-03: AI 분류 및 요약 (Bedrock)

- **FR-03.1**: Bedrock Claude 4 Sonnet으로 리뷰를 분석/분류한다
- **FR-03.2**: Severity scoring으로 P1~P4 우선순위를 부여한다
- **FR-03.3**: Issue summary를 생성한다
- **FR-03.4**: Evidence synthesis로 관련 리뷰를 종합한다
- **FR-03.5**: Owner-specific action brief를 생성한다 (담당팀별)
- **FR-03.6**: 분류/요약 결과를 deterministic하게 처리한다 (동일 입력 → 동일 출력 지향)
- **FR-03.7**: Bedrock 실패 시 keyword 기반 fallback 분류를 사용한다
- **FR-03.8**: AI mode badge를 표시한다 (DETERMINISTIC / AI-ENHANCED / NEEDS REVIEW)

#### 데이터 정제 기준 (Bedrock 처리 결과 스키마)

각 리뷰는 다음 필드로 정제된다:

| 필드 | 설명 |
|------|------|
| 출처 | App Store / Google Play |
| 링크 | 원본 리뷰 URL |
| 리뷰 등록 시간 | 리뷰 작성 timestamp |
| 리뷰 등록 아이디 | 리뷰 작성자 ID |
| 요약 | Bedrock이 생성한 리뷰 요약 |
| 원본 description | 원본 리뷰 텍스트 (redacted) |

#### 기능 분류

| 카테고리 | 설명 |
|----------|------|
| 투표 | 투표 관련 이슈 |
| 광고 | 광고 관련 이슈 |
| 결제 | 결제/포인트 관련 이슈 |
| 라이브 / 동영상 | 라이브/동영상 재생 관련 이슈 |
| 기타 | 위 카테고리에 해당하지 않는 이슈 |

#### 이슈 타입

| 타입 | 설명 |
|------|------|
| 에러 | 실제 버그/오류 |
| 이슈 아님 | 정상 동작이나 사용자 오해 |
| 기능 제안 | 새로운 기능 요청 |
| 스펙인데 유저가 잘못아는거 | 의도된 동작이나 사용자가 오류로 인식 |

#### 에러 등급 (이슈 타입이 "에러"인 경우)

| 등급 | 설명 |
|------|------|
| 1 | 급함 — 즉시 대응 필요 |
| 2 | 나중에 대응 가능 |
| 3 | 알고만 있으면 됩니다 |

### FR-04: 처리 결과 저장 (DynamoDB)

- **FR-04.1**: Bedrock 처리 완료된 결과를 DynamoDB single-table에 저장한다
- **FR-04.2**: Review event, Source status, Cluster snapshot, Action brief 4가지 item shape를 지원한다
- **FR-04.3**: TTL(expiresAt)로 오래된 데이터를 자동 정리한다
- **FR-04.4**: source/day 기준 최근 리뷰 조회를 지원한다
- **FR-04.5**: category/severity별 cluster 조회를 지원한다

### FR-05: 대시보드 UI (Command Center)

- **FR-05.1**: Severity-first 운영 커맨드 센터 UI를 제공한다
- **FR-05.2**: Source health rail을 표시한다 (LIVE / REPLAY / BLOCKED / STALE)
- **FR-05.3**: Rising issues 목록을 severity 순으로 표시한다
- **FR-05.4**: Live/replay feed를 실시간으로 표시한다
- **FR-05.5**: Issue detail 화면에서 evidence panel과 action brief panel을 제공한다
- **FR-05.6**: 폴링으로 일정 간격 자동 갱신한다
- **FR-05.7**: 정제된 데이터를 기준으로 기능 분류별, 이슈 타입별, 에러 등급별 필터/조회를 지원한다

### FR-06: Source Health

- **FR-06.1**: 각 데이터 소스의 상태를 모니터링한다
- **FR-06.2**: Source mode badge를 표시한다 (LIVE / REPLAY / BLOCKED / STALE)
- **FR-06.3**: Source별 최신 health 상태를 DynamoDB에 저장/조회한다

### FR-07: 주기적 수집 및 알림

- **FR-07.1**: 외부 서비스(App Store, Google Play)에서 데이터를 주기적으로 수집한다
- **FR-07.2**: 수집한 데이터를 정제(분석, 분류)한다
- **FR-07.3**: 대시보드에서 정제된 데이터를 조회할 수 있다
- **FR-07.4**: (Should-have) 새로운 P1 이슈 발생 시 알림을 보낸다

---

## 4. Non-Functional Requirements

### NFR-01: 가용성 / Resilience

- Bedrock 실패 시 keyword 기반 fallback 분류로 대시보드 동작 유지
- Google Play live 실패 시 replay fallback으로 데모 유지
- App Store RSS 실패 시 seed data fallback
- S3 저장 실패 시에도 파이프라인 중단하지 않음 (로그 후 재시도)

### NFR-02: 성능

- 대시보드 초기 로딩: 3초 이내
- 폴링 간격: 30초~60초 (설정 가능)
- DynamoDB 조회: full table scan 금지

### NFR-03: 보안 (Security Extension 적용)

- SECURITY-01~15 규칙 전체 적용
- S3 버킷 암호화 at rest + public access 차단
- DynamoDB 암호화 at rest (AWS managed key)
- API Gateway + Lambda에 적절한 IAM 정책
- 리뷰 원문 과다 노출 방지 (redaction)
- HTTP security headers 적용
- Input validation on all API parameters

### NFR-04: 테스트

- Vitest로 단위 테스트
- fast-check으로 PBT (Partial: 순수 함수, 직렬화 round-trip)
- Classifier, severity scoring, action brief 핵심 로직 테스트 필수

### NFR-05: 배포

- UI: Vite 빌드 결과물을 S3 + CloudFront 정적 호스팅 (또는 Amplify Hosting)
- API: AWS Lambda + API Gateway로 서버리스 배포
- UI와 API 분리 배포 (SPA + REST API 구조)

---

## 5. DynamoDB 설계

### Table: FanFrictionRadar

```
Billing: on-demand
TTL attribute: expiresAt
Primary key: PK, SK
Optional GSI: GSI1PK, GSI1SK
```

### Item Shapes

| Item | PK | SK |
|------|----|----|
| Review event | REVIEW#\<source\>#\<yyyy-mm-dd\> | \<timestamp\>#\<sourceReviewIdOrHash\> |
| Source status | SOURCE#\<source\> | STATUS#LATEST |
| Cluster snapshot | CLUSTER#\<category\> | \<severity\>#\<updatedAt\>#\<clusterId\> |
| Action brief | ACTION#\<clusterId\> | VERSION#\<timestamp\> |

### Access Patterns

- source/day 기준 최근 리뷰 조회
- source별 최신 health 조회
- category/severity별 cluster 조회
- cluster별 action brief 조회

---

## 6. API 구조

```
POST /api/ingest          — connector 실행: 리뷰 수집 → S3 저장 → Bedrock 처리 → DynamoDB 저장
GET  /api/issues          — rising issues / clusters 조회
GET  /api/issues/[clusterId] — issue detail + evidence + action brief
POST /api/actions/[clusterId] — Bedrock action brief 재생성
GET  /api/health          — source health 조회
```

---

## 7. 데모 성공 기준

- App Store 또는 seed data가 review event로 normalize된다
- Google Play evidence가 replay/live로 명확히 표시된다
- DynamoDB에 review/source/cluster/action item이 저장된다
- Dashboard가 "Ads blocking vote completion"을 P1 issue로 보여준다
- Issue detail이 redacted evidence와 source mode를 보여준다
- Deterministic classifier만으로도 demo가 동작한다
- Bedrock이 켜지면 action brief가 개선된다
- Bedrock이 꺼져도 dashboard는 깨지지 않는다
- UI가 severity-first command center처럼 보인다

---

## 8. Extension Configuration

| Extension | Enabled | Mode | Decided At |
|-----------|---------|------|------------|
| security-baseline | Yes | Full | Requirements Analysis |
| property-based-testing | Yes | Partial (순수 함수 + 직렬화 round-trip만) | Requirements Analysis |

---

## 9. 제약사항 및 리스크

| 리스크 | 대응 |
|--------|------|
| App Store RSS 불안정 | seed/replay fallback |
| Google Play live 불안정 | replay로 명확히 표시 |
| Bedrock 권한 없음 | deterministic fallback |
| DynamoDB 설정 지연 | setup script + minimal schema 우선 |
| 리뷰 원문 과다 노출 | redaction + 짧은 excerpt |
| Lambda cold start | provisioned concurrency 또는 warm-up 고려 |
