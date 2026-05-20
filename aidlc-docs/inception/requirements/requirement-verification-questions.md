# 요구사항 확인 질문

팀 공유 문서를 분석했습니다. 아래 질문에 답변해주시면 요구사항을 확정하겠습니다.
각 질문의 `[Answer]:` 뒤에 선택지 알파벳을 입력해주세요.

---

## Question 1
Next.js 버전은 어떤 것을 사용할 예정인가요?

A) Next.js 14 (App Router)
B) Next.js 15 (App Router, 최신)
C) Next.js 14 (Pages Router)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
DynamoDB 접근 방식은 어떤 것을 사용할 예정인가요?

A) AWS SDK v3 DynamoDBDocumentClient 직접 사용
B) ElectroDB 같은 single-table ORM 사용
C) DynamoDB Toolbox 사용
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
Bedrock에서 사용할 모델은 무엇인가요?

A) Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet)
B) Claude 3 Haiku (빠르고 저렴)
C) Claude 4 Sonnet (최신)
D) 아직 미정 — 해커톤 당일 사용 가능한 모델로 결정
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
App Store 리뷰 수집 방식은 어떤 것을 사용할 예정인가요?

A) Apple RSS Feed (공개 API, 최근 리뷰 제한적)
B) 사전 수집된 JSON seed 데이터 + RSS Feed 보조
C) RSS Feed primary + seed fallback
X) Other (please describe after [Answer]: tag below)

[Answer]: X (권장안)

## Question 5
배포 환경은 어떻게 할 예정인가요?

A) AWS Amplify Hosting
B) Vercel
C) 로컬 개발 서버로만 데모 (배포 없음)
D) EC2/ECS 직접 배포
X) Other (please describe after [Answer]: tag below)

[Answer]: X (AWS 람다랑 api 게이트웨이)

## Question 6
해커톤 데모 시 DynamoDB는 어떤 환경을 사용하나요?

A) AWS 실제 DynamoDB (팀 AWS 계정 사용)
B) DynamoDB Local (Docker)
C) 실제 DynamoDB primary + Local fallback
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
UI 프레임워크/스타일링은 어떤 것을 사용할 예정인가요?

A) Tailwind CSS만 사용
B) Tailwind CSS + shadcn/ui 컴포넌트
C) Tailwind CSS + 커스텀 컴포넌트만
D) CSS Modules
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 8
테스트 프레임워크는 어떤 것을 사용할 예정인가요?

A) Vitest (단위 테스트)
B) Jest (단위 테스트)
C) Vitest + Playwright (단위 + E2E)
D) 해커톤이라 최소한의 테스트만 (프레임워크 미정)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
패키지 매니저는 무엇을 사용하나요?

A) npm
B) pnpm
C) yarn
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10
실시간 데이터 갱신 방식은 어떤 것을 사용할 예정인가요?

A) 수동 새로고침 (버튼 클릭)
B) 폴링 (일정 간격 자동 갱신)
C) Server-Sent Events (SSE)
D) 데모에서는 수동 새로고침, 이후 폴링 추가
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Extension 질문

## Question 11: Security Extension
이 프로젝트에 보안 확장 규칙을 적용할까요?

A) Yes — 모든 SECURITY 규칙을 blocking constraint로 적용 (프로덕션 수준 앱에 권장)
B) No — 모든 SECURITY 규칙 건너뜀 (PoC, 프로토타입, 해커톤 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 12: Property-Based Testing Extension
이 프로젝트에 Property-Based Testing (PBT) 규칙을 적용할까요?

A) Yes — 모든 PBT 규칙을 blocking constraint로 적용 (비즈니스 로직, 데이터 변환이 있는 프로젝트에 권장)
B) Partial — 순수 함수와 직렬화 round-trip에만 PBT 규칙 적용
C) No — 모든 PBT 규칙 건너뜀 (단순 CRUD, UI 전용 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: X (권장안)
