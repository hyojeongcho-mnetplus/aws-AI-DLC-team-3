import type { ClusterSnapshot, ProcessedReview } from '../types/index.js';

/**
 * Action Brief 프롬프트
 *
 * 목적: 클러스터링된 이슈에 대해 운영자/내부 관계자가 바로 행동할 수 있는
 * 담당팀, 상황 요약, 구체적 조치 사항을 생성한다.
 */
export function buildActionBriefPrompt(cluster: ClusterSnapshot, evidence: ProcessedReview[]): string {
  const evidenceInput = evidence.slice(0, 10).map((r) => ({
    id: r.id,
    source: r.source,
    category: r.category,
    issueType: r.issueType,
    errorLevel: r.errorLevel,
    summary: r.summary,
    body: r.body.slice(0, 200),
    createdAt: r.createdAt,
  }));

  return `당신은 Mnet Plus 운영팀의 이슈 대응 어시스턴트입니다.

## 목적
대시보드에서 운영자와 내부 관계자가 이 이슈를 보고 즉시 행동할 수 있도록,
담당팀을 지정하고, 상황을 요약하고, 구체적인 다음 조치를 제안합니다.

## 담당팀 (owner) 판별 기준
| 값 | 담당 범위 | 예시 이슈 |
|---|---|---|
| vote_team | 투표 기능, 투표권 지급, 투표 결과 처리 | "투표 버튼 무반응", "투표 결과 미반영" |
| ads_team | 광고 SDK, 광고 보상 지급, 광고-투표 연동 | "광고 시청 후 보상 미지급", "광고 로딩 실패" |
| payment_team | 결제, 포인트, 환불, 인앱 구매 | "결제 완료 후 포인트 미적립", "환불 처리 지연" |
| live_team | 라이브 방송, 동영상 스트리밍, 미디어 플레이어 | "라이브 끊김", "영상 재생 불가" |
| app_team | 앱 안정성, 로그인, UI, 성능, 기타 전반 | "앱 크래시", "로그인 실패", "화면 깨짐" |

복합 이슈(예: 광고 후 투표 실패)는 가장 근본 원인에 가까운 팀을 선택하세요.
판단이 어려우면 app_team으로 지정하세요.

## 좋은 출력 예시
- owner: "ads_team"
- summary: "광고 시청 완료 후 투표가 반영되지 않는 문제가 최근 5건 반복 발생 중. iOS/Android 모두 해당."
- suggestedAction: "광고 SDK completion callback과 투표 API 연동 로그 확인 필요. 최근 배포(v3.2.1) 이후 발생 여부 점검 요청."

## 나쁜 출력 예시 (이렇게 쓰지 마세요)
- summary: "사용자들이 불만을 제기하고 있습니다" (너무 모호)
- suggestedAction: "확인해주세요" (구체적이지 않음)

## 클러스터 정보
${JSON.stringify({ clusterId: cluster.clusterId, category: cluster.category, severity: cluster.severity, title: cluster.title, issueType: cluster.issueType, errorLevel: cluster.errorLevel, reviewCount: cluster.reviewCount }, null, 2)}

## 증거 리뷰 (최근 ${evidenceInput.length}건)
${JSON.stringify(evidenceInput, null, 2)}

## 출력 규칙
- 반드시 아래 JSON 형식으로만 출력하세요. 설명, 마크다운, 코드블록 없이 순수 JSON만.
- summary: 한국어 2문장 이내. 현재 상황 + 영향 범위를 운영자가 바로 이해할 수 있게.
- suggestedAction: 구체적인 확인/조치 사항. "~확인 필요", "~점검 요청" 형태로 실행 가능하게.
- 증거 리뷰에 있는 내용만 기반으로 작성하세요. 추측하거나 없는 정보를 만들지 마세요.

## 출력 형식
{"owner":"<team>","summary":"<상황 요약>","suggestedAction":"<구체적 조치 사항>"}`;
}
