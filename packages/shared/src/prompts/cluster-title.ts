import type { ProcessedReview } from '../types/index.js';

/**
 * 클러스터 타이틀 생성 프롬프트
 *
 * 목적: 유사한 리뷰 그룹을 대시보드에서 한눈에 파악할 수 있는
 * 이슈 제목을 자동 생성한다.
 *
 * 사용 시점: 새로운 클러스터가 생성될 때, 또는 리뷰가 추가되어 클러스터 성격이 변할 때
 */
export function buildClusterTitlePrompt(reviews: ProcessedReview[]): string {
  const input = reviews.slice(0, 10).map((r) => ({
    summary: r.summary,
    category: r.category,
    issueType: r.issueType,
    body: r.body.slice(0, 150),
  }));

  return `당신은 Mnet Plus 앱 운영 대시보드의 이슈 제목 작성자입니다.

## 목적
아래 리뷰들은 같은 이슈로 묶인 그룹입니다.
운영자가 대시보드에서 이 그룹을 보고 즉시 "어떤 문제인지" 파악할 수 있는 제목을 만드세요.

## 좋은 제목 예시
- "광고 시청 후 투표가 반영되지 않음"
- "앱 업데이트 후 로그인 반복 실패"
- "라이브 방송 중 화면 멈춤 현상"
- "포인트 적립 누락"

## 나쁜 제목 예시 (이렇게 쓰지 마세요)
- "여러 사용자가 불만을 제기함" (너무 모호)
- "버그" (정보 없음)
- "광고 관련 이슈가 있습니다" (구체적이지 않음)

## 규칙
- 한국어 1문장, 20자 이내
- 구체적인 현상을 명시 (무엇이 + 어떻게 안 되는지)
- 원인 추측 금지, 현상만 기술
- JSON만 출력

## 입력 리뷰 그룹
${JSON.stringify(input, null, 2)}

## 출력 형식
{"title":"<이슈 제목>"}`;
}
