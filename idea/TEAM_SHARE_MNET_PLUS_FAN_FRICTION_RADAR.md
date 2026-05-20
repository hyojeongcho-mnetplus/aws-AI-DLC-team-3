# 팀 공유용: Mnet Plus Fan Friction Radar 계획 요약

작성일: 2026-05-10  
목적: AWS AI-DLC 해커톤 당일 팀원들이 같은 그림을 보고 바로 구현에 들어가기 위한 공유 문서

---

## 1. 한 줄 요약

**Mnet Plus Fan Friction Radar**는 App Store와 Google Play의 공개 리뷰/피드백을 수집해, 지금 팬들이 겪는 가장 큰 마찰을 실시간 운영 이슈처럼 보여주는 AI 기반 팬 프릭션 커맨드 센터입니다.

> 앱스토어/구글플레이 리뷰 → DynamoDB 저장 → deterministic 분류 → Bedrock 요약/액션 브리프 → 운영자 대시보드

이건 단순한 “리뷰 요약기”가 아닙니다. 핵심은 **scattered feedback-to-action**, 즉 흩어진 팬 불만을 운영자가 바로 볼 수 있는 이슈/증거/담당 액션으로 바꾸는 것입니다.

---

## 2. 우리가 풀 문제

Mnet Plus는 투표, 팬 이벤트, 광고 보상, 로그인, 포인트, 앱 안정성 같은 이슈가 팬 경험에 직접 영향을 줍니다.

하지만 실제 팬 불만은 여러 곳에 흩어져 있습니다.

- App Store 리뷰
- Google Play 리뷰
- 커뮤니티/웹 검색 결과
- 팬덤 SNS 반응
- 반복되는 별점/불만 패턴

운영자 입장에서는 다음을 빠르게 알기 어렵습니다.

- 지금 가장 많이 올라오는 불만이 무엇인지
- 단순 불평인지 실제 product defect인지
- 투표/광고/로그인/포인트 중 어느 팀이 봐야 하는지
- 어떤 원문 증거가 있는지
- 라이브 데이터인지 replay/sample 데이터인지
- AI 요약이 사실 기반인지 추론인지

---

## 3. 리서치 근거

이번 아이디어는 실제 Mnet Plus 공개 리뷰 샘플을 기반으로 잡았습니다.

### iOS App Store 샘플

- 수집량: 535개
- 주요 카테고리:
  - vote/voting failure: 218
  - fairness/trust/exclusion/rigging: 173
  - ads: 130
  - crash/freeze/lag/white screen: 48
  - points/rewards: 25
  - login/account: 9

### Google Play 샘플

- 수집량: 1,479개
- 주요 카테고리:
  - vote/voting failure: 378
  - ads: 283
  - fairness/trust: 212
  - crash/freeze/lag/white screen: 153
  - points/rewards: 67
  - login/account: 57

### 데모 앵커 이슈

해커톤 데모의 중심 이슈는 다음으로 잡습니다.

> **Ads blocking vote completion**  
> 광고를 봤는데 투표가 완료되지 않거나, 광고가 투표 흐름을 막는 문제

이 이슈가 좋은 이유:

- App Store와 Google Play 양쪽 샘플에서 반복됨
- vote + ads + trust 문제가 한 화면에 드러남
- 운영자가 바로 이해할 수 있음
- 담당팀/action으로 연결하기 쉬움
- fairness/rigging 같은 민감한 주장보다 데모 리스크가 낮음

---

## 4. 제품 가설

AI가 공개 리뷰를 정리해 “지금 가장 중요한 팬 마찰”을 증거와 액션으로 보여주면:

- 운영자가 산발적인 리뷰를 직접 읽는 시간이 줄어든다.
- 반복 이슈를 더 빨리 발견할 수 있다.
- product defect와 fandom/trust wave를 구분할 수 있다.
- 담당팀별 action brief를 빠르게 만들 수 있다.
- AWS AI 사용 가치가 명확하게 보인다.

해커톤에서는 실제 운영 개선 수치를 주장하지 않고, **review-to-action demo**로 보여줍니다.

예시:

```txt
1,479개 Google Play 리뷰 + 535개 App Store 리뷰
  ↓
P1 Ads blocking vote completion 발견
  ↓
증거 리뷰 3개 + source mode + redaction
  ↓
Owner: ads / vote backend / app
  ↓
Slack/Jira-style action brief
```

---

## 5. 최종 방향

최종 방향은 **Live Friction Command Center**입니다.

초기 후보는 두 가지였습니다.

- A. Evidence-to-Action Board
- B. Live Friction Command Center

최종 선택은:

> **B powered by A**

즉, 사용자에게 보이는 제품은 실시간 커맨드 센터이고, 그 내부 엔진은 evidence-to-action pipeline입니다.

---

## 6. MVP 범위

### Must-have

해커톤 당일 반드시 완성해야 하는 범위입니다.

- App Store primary live connector
- Google Play secondary live/replay connector
- DynamoDB single-table 저장
- seed/replay importer
- deterministic-first classifier
- Bedrock summary/action brief enhancement
- severity-first command dashboard
- source health rail
- live/replay feed
- rising issues list
- issue detail 화면
  - evidence panel
  - action brief panel
- source mode badge
  - LIVE
  - REPLAY
  - BLOCKED
  - STALE
- AI mode badge
  - DETERMINISTIC
  - AI-ENHANCED
  - NEEDS REVIEW
- demo anchor issue: Ads blocking vote completion

### Should-have

Must-have가 안정화된 뒤 진행합니다.

- source confidence score
- evidence redaction
- campaign wave vs product defect classifier
- Slack/Jira-style draft copy
- better empty/error/partial states

### Stretch

시간이 남을 때만 합니다.

- Twitter/X 또는 커뮤니티 public web signal
- trend chart
- multi-country App Store expansion
- owner workflow actions
- deploy polish

중요: Stretch는 핵심 데모를 막으면 안 됩니다.

---

## 7. 데모 흐름

발표에서 보여줄 기본 흐름입니다.

```txt
1. Operator opens command center
2. Source health shows App Store LIVE and Google Play REPLAY/LIVE
3. Dashboard highlights P1 Ads blocking vote completion
4. Operator clicks issue card
5. Detail shows redacted evidence from App Store and Google Play
6. Bedrock-enhanced action brief appears
7. Presenter explains owner/action path
8. If Bedrock or Google Play live fails, deterministic/replay fallback still works
```

발표에서 보여줄 핵심 장면은 이것입니다.

```txt
Scattered reviews
  ↓
Rising issue: Ads blocking vote completion
  ↓
Evidence + source mode + confidence
  ↓
Owner-specific action brief
```

---

## 8. 기술 방향

결정된 기본안은 **Next.js 단일 앱 + DynamoDB-first**입니다.

```txt
/connectors/app-store
  └─ App Store public RSS/feed adapter

/connectors/google-play
  └─ Google Play replay/live adapter

/api/ingest
  └─ connector 실행 또는 seed import trigger

/api/issues
  └─ rising issues / clusters 조회

/api/issues/[clusterId]
  └─ issue detail + evidence + action brief

/api/actions/[clusterId]
  └─ Bedrock action brief 생성/조회

/
  └─ severity-first command center UI
```

### AWS 사용 계획

- Storage: DynamoDB single table
- AI: Amazon Bedrock
- Optional hosting: Amplify Hosting, 가능할 때만
- Fallback: local JSON seed/replay data

이번 두번째 주제는 4명 팀 기준으로 **DynamoDB-first**로 갑니다. Local JSON은 메인 저장소가 아니라 seed/replay fallback입니다.

---

## 9. DynamoDB 설계

테이블은 하나만 사용합니다.

```txt
Table: FanFrictionRadar
Billing: on-demand
TTL attribute: expiresAt
Primary key: PK, SK
Optional GSI: GSI1PK, GSI1SK
```

### Item shapes

```txt
Review event
PK = REVIEW#<source>#<yyyy-mm-dd>
SK = <timestamp>#<sourceReviewIdOrHash>

Source status
PK = SOURCE#<source>
SK = STATUS#LATEST

Cluster snapshot
PK = CLUSTER#<category>
SK = <severity>#<updatedAt>#<clusterId>

Action brief
PK = ACTION#<clusterId>
SK = VERSION#<timestamp>
```

### Access patterns

- source/day 기준 최근 리뷰 조회
- source별 최신 health 조회
- category/severity별 cluster 조회
- cluster별 action brief 조회
- degraded source 조회, optional GSI

피해야 할 것:

- 여러 DynamoDB table
- 복잡한 GSI 남발
- dashboard refresh마다 full table scan
- raw review body 과도 저장/노출
- OpenSearch 등 추가 인프라 도입

---

## 10. AI/분류 방향

AI는 demo를 막으면 안 됩니다.

기본 원칙:

> deterministic-first, Bedrock-enhanced

### Deterministic classifier

모델 없이도 동작해야 합니다.

분류 예시:

- vote failure
- ads issue
- login/account
- points/rewards
- crash/performance
- trust/fairness
- translation/localization

### Bedrock enhancer

Bedrock은 다음을 개선합니다.

- issue summary
- evidence synthesis
- owner-specific action brief
- Slack/Jira-style draft
- severity explanation

하지만 Bedrock 실패 시에도 dashboard는 계속 동작해야 합니다.

```txt
Bedrock success → AI-ENHANCED badge
Bedrock failure → DETERMINISTIC badge + fallback summary
Unsupported claim → NEEDS REVIEW badge
```

---

## 11. 디자인 방향

디자인 방향은 **severity-first operations command center**입니다.

일반적인 AI SaaS 랜딩 페이지처럼 보이면 실패입니다. 운영 상황판처럼 보여야 합니다.

### 첫 화면의 주인공

**Rising P1/P2 Issues**가 중앙에 와야 합니다.

```txt
+--------------------------------------------------------------------------------+
| Fan Friction Radar          Top risk: P1 Ads blocking vote     Updated 12:04   |
| Mode: App Store LIVE · Google Play REPLAY · AI deterministic+Bedrock enhanced   |
+----------------------+----------------------------------+--------------------+
| SOURCE HEALTH        | RISING ISSUES                    | LIVE / REPLAY FEED |
| App Store   LIVE     | [P1] Ads blocking vote           | 12:04 App Store    |
| Google Play REPLAY   |      +37% · product defect       | 12:03 Google Play  |
| Bedrock     ENHANCED |      owners: ads, vote backend   | 12:03 App Store    |
| DynamoDB    SYNCED   |      badges: live+replay, AI     | ...                |
+----------------------+----------------------------------+--------------------+
| ISSUE DETAIL: Ads blocking vote completion                                      |
| +--------------------------------------+---------------------------------------+ |
| | EVIDENCE                             | ACTION BRIEF                          | |
| | App Store LIVE · redacted            | Owner: ads + vote_backend + app       | |
| | “Watched ad but vote did not...”     | Suggested check: ad_completed vs...   | |
| | Google Play REPLAY · source sample   | Slack draft: Investigating reports... | |
| | “After ads my vote never...”         | [Copy brief] [Mark needs review]      | |
| +--------------------------------------+---------------------------------------+ |
+--------------------------------------------------------------------------------+
```

### 피해야 할 디자인

- 보라색 AI gradient hero
- 3-column feature grid
- icon-in-circle 카드
- 전부 가운데 정렬된 SaaS 랜딩 페이지
- 의미 없는 dashboard card mosaic
- “unlock insights with AI” 같은 generic copy

키워드:

> Operations room, not SaaS landing page.

---

## 12. Kiro Pro+ 활용 계획

행사 당일 Kiro Pro+ 계정이 최대 72시간 제공될 예정입니다.

Kiro는 구현 가속 도구로 사용합니다. 런타임이나 AWS 계정을 대체하지 않습니다.

사용 방법:

1. Kiro에서 Feature Spec 생성
2. 아래 파일을 Kiro spec에 입력
   - `.kiro/specs/mnet-plus-fan-friction-radar/requirements.md`
   - `.kiro/specs/mnet-plus-fan-friction-radar/design.md`
   - `.kiro/specs/mnet-plus-fan-friction-radar/tasks.md`
3. Wave 1 shared foundation 먼저 완료
4. DynamoDB schema와 shared types가 안정화되면 4개 lane으로 병렬 진행
5. Bedrock/Google Play live가 막히면 deterministic/replay fallback으로 데모 유지

---

## 13. Kiro Task Waves

### Wave 1: Shared Foundation

- Next.js scaffold
- shared domain types
- design tokens/layout shell
- fixture paths 정리
- env example 정리

### Wave 2: AWS/Data

- DynamoDB setup script
- DynamoDBDocumentClient
- repository layer
- seed importer
- access pattern validation

### Wave 3: Connectors

- App Store RSS adapter
- Google Play secondary adapter
- source health model
- dedupe/hash

### Wave 4: AI/Domain

- deterministic classifier
- severity scoring
- campaign wave vs product defect classifier
- redaction/source confidence
- Bedrock action brief enhancer

### Wave 5: UI/Demo

- severity-first command shell
- source health rail
- rising issues list
- feed
- issue detail evidence/action split
- badges and fallback states

### Wave 6: Wire Together

- ingest API
- issues API
- action brief API
- seeded DynamoDB data to UI
- Bedrock enhancement to top clusters

### Wave 7: QA/Demo Hardening

- repository tests
- connector fixture tests
- classifier tests
- action brief grounding check
- responsive/accessibility check
- event-day runbook

---

## 14. 행사 당일 역할 분담 제안

4명 기준입니다.

### Person A: AWS/Data

- DynamoDB table setup
- repository layer
- seed importer
- `.env.example`
- `npm run db:setup`
- `npm run seed:reviews`

### Person B: Connectors

- App Store public RSS/feed adapter
- Google Play replay/live adapter
- source health status
- dedupe/hash
- connector fallback states

### Person C: AI/Domain

- deterministic classifier
- severity scoring
- campaign wave vs product defect classifier
- redaction/source confidence
- Bedrock enhancer
- owner-specific action brief

### Person D: UI/Demo

- command center dashboard
- source health rail
- rising issues
- live/replay feed
- issue detail
- demo script/runbook polish

처음 30-45분은 shared types, item shape, fixture path를 같이 맞추고, 그 다음 4개 lane으로 나누는 게 좋습니다.

---

## 15. 성공 기준

해커톤 demo 성공 기준:

- App Store 또는 seed data가 review event로 normalize된다.
- Google Play evidence가 replay/live로 명확히 표시된다.
- DynamoDB에 review/source/cluster/action item이 저장된다.
- dashboard가 `Ads blocking vote completion`을 P1 issue로 보여준다.
- issue detail이 redacted evidence와 source mode를 보여준다.
- deterministic classifier만으로도 demo가 동작한다.
- Bedrock이 켜지면 action brief가 개선된다.
- Bedrock이 꺼져도 dashboard는 깨지지 않는다.
- UI가 severity-first command center처럼 보인다.
- 발표자가 AWS path를 설명할 수 있다.

```txt
connectors -> DynamoDB -> classifier -> Bedrock -> UI
```

---

## 16. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| App Store feed country별 응답 불안정 | seed/replay importer 유지 |
| Google Play live scraping 불안정 | secondary replay로 명확히 표시 |
| Bedrock 권한 없음 | deterministic summary/action fallback |
| DynamoDB 설정 지연 | setup script와 minimal schema 우선 |
| 리뷰 원문 과다 노출 | redaction + 짧은 evidence excerpt |
| fairness/rigging 주장으로 데모가 민감해짐 | golden incident를 ads blocking vote로 고정 |
| 화면이 generic AI dashboard처럼 보임 | severity-first operations command 유지 |
| connector 구현에 시간 과소비 | App Store primary, Google Play replay 우선 |

---

## 17. 현재 산출물 위치

### Main spec

```txt
.omx/specs/mnet-plus-fan-friction-radar.md
```

### Research/context

```txt
.omx/research/mnet-plus-user-feedback-research-20260510.md
.omx/research/mnet-plus-ios-reviews-sample.json
.omx/research/mnet-plus-google-play-reviews-sample.json
.omx/context/mnet-plus-fan-friction-radar-expanded-research-20260510T223459.md
```

### Review snapshots

```txt
.omx/context/mnet-plus-fan-friction-radar-ceo-review-20260510.md
.omx/context/mnet-plus-fan-friction-radar-eng-review-dynamodb-20260510.md
.omx/context/mnet-plus-fan-friction-radar-design-review-20260510.md
```

### Kiro pack

```txt
.kiro/specs/mnet-plus-fan-friction-radar/requirements.md
.kiro/specs/mnet-plus-fan-friction-radar/design.md
.kiro/specs/mnet-plus-fan-friction-radar/tasks.md
.kiro/specs/mnet-plus-fan-friction-radar/README.md
```

---

## 18. 첫번째 주제와 비교

| 항목 | Vote Bridge | Fan Friction Radar |
|---|---|---|
| 데모 안정성 | 더 쉬움 | 중간 |
| AI 사용 명확성 | 좋음 | 매우 좋음 |
| AWS/DynamoDB 설득력 | 중간 | 높음 |
| 실제 운영자 가치 | 캠페인 전환 | 제품/운영 이슈 탐지 |
| 구현 리스크 | 낮음 | 중간 |
| 데이터 근거 | app/deeplink 기반 | 실제 리뷰 샘플 기반 |

현재 판단:

- 안정적인 데모를 원하면 Vote Bridge
- AWS AI + 데이터 파이프라인 + 운영 가치가 더 잘 보이는 쪽은 Fan Friction Radar

Fan Friction Radar 점수:

- CEO review: 8.7/10
- Eng review: 8.4/10
- Design review: 8.5/10

---

## 19. 바로 다음 액션

1. 팀원에게 이 문서를 공유한다.
2. 두 주제 중 최종 구현 주제를 팀에서 결정한다.
3. Fan Friction Radar를 선택하면 Kiro에 `.kiro/specs/mnet-plus-fan-friction-radar/` 3파일을 넣는다.
4. Wave 1에서 shared schema와 DynamoDB item shape를 먼저 잠근다.
5. App Store primary + Google Play replay + deterministic classifier부터 end-to-end로 붙인다.
6. Bedrock enhancement와 UI polish는 end-to-end path가 돈 뒤 붙인다.

핵심 원칙:

> 먼저 리뷰가 DynamoDB에 들어가고, P1 이슈가 dashboard에 보이게 만든다. 그 다음 Bedrock과 디자인 polish를 붙인다.
