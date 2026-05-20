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
앱스토어/구글플레이 리뷰 → DynamoDB 저장 → deterministic 분류 → Bedrock 요약/액션 브리프 → 운영자 대시보드
```

**데모 앵커 이슈:** Ads blocking vote completion

---

## 2. 기술 스택 결정사항

| 항목 | 결정 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Package Manager | pnpm |
| DynamoDB 접근 | AWS SDK v3 DynamoDBDocumentClient 직접 사용 |
| Bedrock 모델 | Claude 4 Sonnet |
| App Store 수집 | RSS Feed primary + seed fallback (권장안 적용) |
| 배포 | AWS Lambda + API Gateway |
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
- **FR-01.3**: RSS Feed 실패 시 사전 수집된 JSON seed 데이터로 fallback한다
- **FR-01.4**: 중복 리뷰를 hash 기반으로 제거한다
- **FR-01.5**: 수집된 리뷰를 정규화된 review event 형태로 변환한다

### FR-02: 데이터 저장 (DynamoDB)

- **FR-02.1**: Single-table 설계로 DynamoDB에 저장한다
- **FR-02.2**: Review event, Source status, Cluster snapshot, Action brief 4가지 item shape를 지원한다
- **FR-02.3**: TTL(expiresAt)로 오래된 데이터를 자동 정리한다
- **FR-02.4**: source/day 기준 최근 리뷰 조회를 지원한다
- **FR-02.5**: category/severity별 cluster 조회를 지원한다

### FR-03: 분류 (Classifier)

- **FR-03.1**: Deterministic classifier로 리뷰를 카테고리별 분류한다 (vote failure, ads issue, login/account, points/rewards, crash/performance, trust/fairness, translation/localization)
- **FR-03.2**: Severity scoring으로 P1~P4 우선순위를 부여한다
- **FR-03.3**: Bedrock 없이도 분류가 동작한다 (deterministic-first)

### FR-04: AI Enhancement (Bedrock)

- **FR-04.1**: Bedrock Claude 4 Sonnet으로 issue summary를 생성한다
- **FR-04.2**: Evidence synthesis로 관련 리뷰를 종합한다
- **FR-04.3**: Owner-specific action brief를 생성한다 (담당팀별)
- **FR-04.4**: Bedrock 실패 시 deterministic fallback summary를 사용한다
- **FR-04.5**: AI mode badge를 표시한다 (DETERMINISTIC / AI-ENHANCED / NEEDS REVIEW)

### FR-05: 대시보드 UI (Command Center)

- **FR-05.1**: Severity-first 운영 커맨드 센터 UI를 제공한다
- **FR-05.2**: Source health rail을 표시한다 (LIVE / REPLAY / BLOCKED / STALE)
- **FR-05.3**: Rising issues 목록을 severity 순으로 표시한다
- **FR-05.4**: Live/replay feed를 실시간으로 표시한다
- **FR-05.5**: Issue detail 화면에서 evidence panel과 action brief panel을 제공한다
- **FR-05.6**: 폴링으로 일정 간격 자동 갱신한다

### FR-06: Source Health

- **FR-06.1**: 각 데이터 소스의 상태를 모니터링한다
- **FR-06.2**: Source mode badge를 표시한다 (LIVE / REPLAY / BLOCKED / STALE)
- **FR-06.3**: Source별 최신 health 상태를 DynamoDB에 저장/조회한다

---

## 4. Non-Functional Requirements

### NFR-01: 가용성 / Resilience

- Bedrock 실패 시에도 대시보드가 동작해야 한다
- Google Play live 실패 시 replay fallback으로 데모 유지
- App Store RSS 실패 시 seed data fallback

### NFR-02: 성능

- 대시보드 초기 로딩: 3초 이내
- 폴링 간격: 30초~60초 (설정 가능)
- DynamoDB 조회: full table scan 금지

### NFR-03: 보안 (Security Extension 적용)

- SECURITY-01~15 규칙 전체 적용
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

- AWS Lambda + API Gateway로 서버리스 배포
- Next.js를 Lambda에 맞게 빌드 (standalone output 또는 OpenNext 등)

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
POST /api/ingest          — connector 실행 또는 seed import trigger
GET  /api/issues          — rising issues / clusters 조회
GET  /api/issues/[clusterId] — issue detail + evidence + action brief
POST /api/actions/[clusterId] — Bedrock action brief 생성/조회
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
