# 팀 공유용: Mnet Plus Vote Bridge 계획 요약

작성일: 2026-05-10  
목적: AWS AI-DLC 해커톤 당일 팀원들이 같은 그림을 보고 바로 구현에 들어가기 위한 공유 문서

---

## 1. 한 줄 요약

**Mnet Plus Vote Bridge**는 글로벌 팬이 “이 투표가 왜 중요한지”를 빠르게 이해하고, 기존 Mnet Plus 앱 투표 화면으로 바로 이동하게 만드는 AI 기반 캠페인 브릿지입니다.

> 긴 캠페인 공지 → AI가 팬 언어로 압축 → 투표 이유/방법/CTA 제공 → Mnet Plus 앱 deep link로 이동

이건 단순한 “AI 랜딩 페이지 생성기”가 아닙니다. 핵심은 **context-to-vote**, 즉 팬의 이해를 투표 참여로 연결하는 것입니다.

---

## 2. 우리가 풀 문제

Mnet Plus에는 투표, 이벤트, 퀴즈, 미션 같은 참여형 캠페인이 많습니다.

하지만 글로벌 팬 입장에서는 다음이 바로 이해되지 않을 수 있습니다.

- 이 투표가 무엇인지
- 왜 지금 참여해야 하는지
- 내 아티스트나 프로그램에 어떤 의미가 있는지
- 정확히 무엇을 누르면 되는지
- 왜 앱을 열어야 하는지

운영자 입장에서도 매 캠페인마다 공지 요약, 번역, CTA 문구, 공유 문구, 성과 확인을 반복해야 합니다.

---

## 3. 제품 가설

AI가 캠페인 공지를 팬 관점으로 압축하고, 명확한 투표 CTA로 연결하면:

- 팬의 이해 시간이 줄어든다.
- 앱 투표 화면으로 들어가는 클릭이 늘어난다.
- 운영자의 캠페인 준비 시간이 줄어든다.

해커톤에서는 실제 production lift를 주장하지 않고, **demo proxy metric**으로만 보여줍니다.

예시:
- 원문 공지 읽기 시간 70초 → AI 요약 10초
- CTA 모호함 → `Vote now in Mnet Plus`
- page view / CTA click 카운터

---

## 4. MVP 범위

### Must-have

해커톤 당일 반드시 완성해야 하는 범위입니다.

- 영어 기준 1개 vote 캠페인
- operator 입력 화면
  - title
  - source notice
  - period
  - participation impact
  - app deep link 또는 voteId
- AI 생성 결과
  - `sourceFacts`
  - `generatedCopy`
  - `needsReview`
- 팬용 bridge page
  - 10초 요약
  - 왜 중요한지
  - 투표 방법
  - `Vote now in Mnet Plus` CTA
- 모바일 sticky CTA + copy fallback
- dashboard
  - page views
  - CTA clicks
  - reading-time delta
  - demo proxy label
- Before/After Proof Panel
  - 원문 공지 vs AI bridge output
- fact guardrail
  - AI가 날짜, 보상, 규칙을 지어내지 않도록 표시

### Should-have

Must-have가 안정화된 뒤 진행합니다.

- CTA/message variants 2-3개
- 더 깔끔한 operator review UI
- dashboard polish

### Stretch

시간이 남을 때만 합니다.

- Share Pack
  - X/Twitter
  - Instagram Story
  - community post
- 다국어
- 국가/언어 segmentation
- Amplify 배포 polish

중요: Share Pack은 좋은 아이디어지만, must-have를 막으면 안 됩니다.

---

## 5. 데모 흐름

```txt
1. Operator opens /operator
2. Operator loads or pastes a sample vote notice
3. AI extracts source facts and generates fan bridge copy
4. Operator reviews sourceFacts / generatedCopy / needsReview
5. Operator opens generated fan bridge page
6. Fan sees 10-second summary and taps Vote now in Mnet Plus
7. Dashboard shows page view, CTA click, and before/after proof
```

발표에서 보여줄 핵심 장면은 이것입니다.

```txt
원문 공지
  ↓
AI fan-context bridge
  ↓
Vote now in Mnet Plus
  ↓
Demo proof metrics
```

---

## 6. 기술 방향

결정된 기본안은 **Next.js 단일 앱**입니다.

```txt
/operator
  └─ 캠페인 입력 + AI 생성 + 검수

/api/campaigns/generate
  └─ Bedrock Converse structured output

/api/campaigns
  └─ campaign 저장

/b/[campaignId]
  └─ 팬용 bridge page

/api/events
  └─ page_view / cta_click 기록

/dashboard/[campaignId]
  └─ proof panel + demo metrics
```

### AWS 사용 계획

- AI: Amazon Bedrock Converse API
- Storage/metrics: DynamoDB
- Hosting: Amplify Hosting, 가능할 때만
- Fallback: local JSON 또는 in-memory store + sample AI output

행사 당일 AWS 권한이나 배포가 막혀도 demo가 멈추면 안 됩니다. Local fallback은 선택이 아니라 안전장치입니다.

---

## 7. Kiro Pro+ 활용 계획

행사 당일 Kiro Pro+ 계정이 최대 72시간 제공될 예정입니다.

Kiro는 구현 가속 도구로 사용합니다. 런타임이나 AWS 계정을 대체하지 않습니다.

사용 방법:

1. Kiro에서 Feature Spec 생성
2. 아래 파일 3개를 Kiro spec에 입력
   - `.kiro/specs/mnet-plus-vote-bridge/requirements.md`
   - `.kiro/specs/mnet-plus-vote-bridge/design.md`
   - `.kiro/specs/mnet-plus-vote-bridge/tasks.md`
3. Wave 1부터 실행
4. schema와 sample fallback이 잡히면 Wave 2를 병렬로 진행
5. AWS가 막히면 local fallback으로 데모 유지

---

## 8. Kiro Task Waves

### Wave 1: Foundation

- Next.js scaffold
- campaign schema/type
- sample campaign fixture
- sample AI output
- deep-link helper

### Wave 2: Independent Core Slices

- `/operator` Editorial Proof Lab shell
- `POST /api/campaigns/generate`
- CampaignStore local/Dynamo adapter
- Fact Guardrail Panel

### Wave 3: Wire Flow Together

- operator generate → campaign create 연결
- `/b/[campaignId]` fan bridge page
- `/api/events` tracking
- `/dashboard/[campaignId]` dashboard

### Wave 4: Quality and Demo Hardening

- unit tests
- integration demo flow test
- AI eval/manual check
- accessibility/responsive checks
- event-day runbook

### Wave 5: Stretch

- CTA variants
- Share Pack
- Amplify deployment polish

---

## 9. 디자인 방향

디자인 방향은 **Editorial Proof Lab**입니다.

일반적인 AI SaaS dashboard처럼 보이면 실패입니다.

### 첫 화면의 주인공

**Before/After Proof Panel**

```txt
Original campaign notice
  vs
AI fan bridge output
```

사용자가 3초 안에 봐야 하는 것:

1. 원문 공지가 길고 이해하기 어렵다.
2. AI bridge가 팬이 이해할 언어로 바꾼다.
3. 최종 행동은 `Vote now in Mnet Plus`다.

### 피해야 할 디자인

- 보라색/파란색 AI gradient hero
- icon-in-circle 3-column feature grid
- 전부 가운데 정렬된 SaaS 랜딩 페이지
- 의미 없는 카드 남발
- “Unlock the power of...” 같은 generic AI copy

### 팬 bridge page

모바일 우선입니다.

- campaign title
- 10-second summary
- why this vote matters
- how to vote
- sticky `Vote now in Mnet Plus` CTA
- `Copy app link` fallback
- `Opens Mnet Plus app` helper text

---

## 10. Fact Guardrails

AI output은 반드시 세 영역으로 나눕니다.

```ts
sourceFacts
  공식 공지와 operator input에서 확인된 사실

generatedCopy
  팬에게 보여줄 요약, 이유, 투표 방법, CTA

needsReview
  누락, 불확실, 위험한 claim
```

AI가 만들면 안 되는 것:

- 없는 날짜
- 없는 보상
- 없는 순위 규칙
- 없는 공식 투표 방식
- 과장된 production lift

Blocker warning이 있으면 publish/open bridge를 막습니다. 단, 해커톤 demo mode에서는 명시적으로 acknowledge한 경우만 진행할 수 있습니다.

---

## 11. 기존 Mnet Plus 앱 활용

앱을 수정하지 않습니다.

확인된 app repo reference:

- `src/lib/Deeplinking.ts`
  - `VoteDetailV2: "vote/v2/:voteId"`
- `src/utils/generateShareUrl.ts`
  - `VoteDetailV2(voteId)`
- analytics examples
  - `vote_button_clicked`
  - `vote_done`

해커톤 서비스는 bridge page와 deep link를 만들고, 실제 투표/로그인은 기존 Mnet Plus 앱이 처리합니다.

---

## 12. 성공 기준

해커톤 demo 성공 기준:

- operator가 sample vote notice로 bridge를 생성한다.
- AI output이 `sourceFacts`, `generatedCopy`, `needsReview`로 나뉜다.
- fan bridge page가 summary, why-it-matters, how-to-vote, CTA를 보여준다.
- CTA가 Mnet Plus app deep link를 열거나 복사한다.
- dashboard가 page views와 CTA clicks를 보여준다.
- Before/After Proof Panel이 원문 대비 AI bridge의 가치를 보여준다.
- 모든 metric은 demo proxy라고 표시한다.
- AWS가 안 되어도 local fallback demo가 된다.

---

## 13. 행사 당일 역할 분담 제안

3명 기준 예시입니다.

### Person A: Product/UI Flow

- `/operator`
- Before/After Proof Panel
- Fact Guardrail Panel
- 디자인 polish

### Person B: AI/API/Schema

- campaign schema
- Bedrock generation endpoint
- sample AI fallback
- output validation

### Person C: Storage/Demo/QA

- CampaignStore
- `/b/[campaignId]`
- `/dashboard/[campaignId]`
- event tracking
- demo runbook

처음 30분은 schema와 sample fixture를 같이 맞추고, 그 다음 병렬로 나누는 게 좋습니다.

---

## 14. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| Bedrock 권한 없음 | sample AI output fallback |
| DynamoDB 설정 지연 | local JSON/in-memory store |
| Amplify 배포 실패 | local demo 유지 |
| Deep link가 기기에서 안 열림 | copy fallback 제공 |
| AI가 사실을 지어냄 | sourceFacts / needsReview / blocker 처리 |
| 화면이 generic AI SaaS처럼 보임 | Editorial Proof Lab 방향 유지 |
| Share Pack에 시간 소모 | stretch로 유지, must-have 완료 전 금지 |

---

## 15. 현재 산출물 위치

### Main spec

```txt
.omx/specs/mnet-plus-vote-bridge-ai-campaign-launchpad.md
```

### Kiro pack

```txt
.kiro/specs/mnet-plus-vote-bridge/requirements.md
.kiro/specs/mnet-plus-vote-bridge/design.md
.kiro/specs/mnet-plus-vote-bridge/tasks.md
.kiro/specs/mnet-plus-vote-bridge/README.md
```

### Review/context snapshots

```txt
.omx/context/
.omx/reviews/final-consistency-pass-20260510.md
```

---

## 16. 바로 다음 액션

1. 팀원에게 이 문서를 공유한다.
2. Kiro에 `.kiro/specs/mnet-plus-vote-bridge/` 3파일을 넣는다.
3. Wave 1부터 시작한다.
4. Local fallback이 되는 순간부터 demo path를 계속 깨지지 않게 유지한다.
5. Must-have가 끝나기 전에는 Share Pack이나 Amplify polish로 새지 않는다.

핵심 원칙:

> 먼저 데모가 끝까지 돌아가게 만든다. 그 다음 AWS polish와 stretch를 붙인다.
