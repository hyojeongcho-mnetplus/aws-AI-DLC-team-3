import type { ReviewEvent } from '../types/index.js';

/**
 * 분류 + 요약 프롬프트
 *
 * 목적: 수집된 리뷰를 운영자/내부 관계자가 대시보드에서 빠르게 파악할 수 있도록
 * 기능 분류, 이슈 타입, 긴급도, 요약을 생성한다.
 */
export function buildClassificationPrompt(reviews: ReviewEvent[]): string {
  const reviewsInput = reviews.map((r) => ({
    id: r.id,
    source: r.source,
    rating: r.rating,
    body: r.body.slice(0, 500),
    createdAt: r.createdAt,
  }));

  return `당신은 Mnet Plus 앱의 사용자 리뷰를 분석하는 전문가입니다.

## 목적
운영자와 내부 관계자가 대시보드에서 현재 가장 중요한 이슈를 빠르게 파악할 수 있도록,
각 리뷰를 정확하게 분류하고 핵심을 요약합니다.

## 분류 기준

### category (기능 분류)
| 값 | 판별 기준 |
|---|---|
| vote | 투표, 투표권, 투표 실패, 투표 결과, 투표 횟수 관련 |
| ads | 광고, 광고 시청, 광고 보상, 광고 후 동작 관련 |
| payment | 결제, 포인트, 환불, 구매, 유료 아이템 관련 |
| live_video | 라이브 방송, 동영상 재생, 스트리밍, 버퍼링 관련 |
| other | 위 4개에 해당하지 않는 모든 것 (로그인, 앱 크래시, UI, 번역 등) |

### issueType (이슈 타입)
| 값 | 판별 기준 |
|---|---|
| error | 앱이 의도대로 동작하지 않는 실제 버그/오류 |
| not_an_issue | 정상 동작이지만 사용자가 불만을 표현하는 경우 |
| feature_request | 새로운 기능이나 개선을 요청하는 경우 |
| spec_misunderstanding | 의도된 동작(스펙)인데 사용자가 오류로 인식하는 경우 |

### errorLevel (이슈 타입이 error일 때만)
| 값 | 판별 기준 |
|---|---|
| 1 | 핵심 기능 차단 (투표 불가, 결제 실패, 앱 크래시 등) — 즉시 대응 필요 |
| 2 | 불편하지만 우회 가능 — 나중에 대응 가능 |
| 3 | 사소한 문제 — 알고만 있으면 됨 |

## 입력 리뷰
${JSON.stringify(reviewsInput, null, 2)}

## 출력 규칙
- 반드시 아래 JSON 형식으로만 출력하세요. 설명, 마크다운, 코드블록 없이 순수 JSON만.
- summary는 한국어 1문장, 30자 이내로 핵심만 작성하세요.
- errorLevel은 issueType이 "error"일 때만 포함하세요.
- 리뷰 내용에 근거하여 판단하세요. 추측하지 마세요.

## 출력 형식
{"results":[{"reviewId":"<id>","category":"<category>","issueType":"<issueType>","errorLevel":<1|2|3 또는 생략>,"summary":"<한국어 요약>"}]}`;
}
