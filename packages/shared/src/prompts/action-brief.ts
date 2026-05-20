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
| 값 | 담당 범위 |
|---|---|
| vote_team | 투표 기능, 투표권 지급, 투표 결과 처리 |
| ads_team | 광고 SDK, 광고 보상 지급, 광고-투표 연동 |
| payment_team | 결제, 포인트, 환불, 인앱 구매 |
| live_team | 라이브 방송, 동영상 스트리밍, 미디어 플레이어 |
| app_team | 앱 안정성, 로그인, UI, 성능, 기타 전반 |

복합 이슈(예: 광고 후 투표 실패)는 가장 근본 원인에 가까운 팀을 선택하세요.

## 클러스터 정보
${JSON.stringify({ clusterId: cluster.clusterId, category: cluster.category, severity: cluster.severity, title: cluster.title, issueType: cluster.issueType, errorLevel: cluster.errorLevel, reviewCount: cluster.reviewCount }, null, 2)}

## 증거 리뷰 (최근 ${evidenceInput.length}건)
${JSON.stringify(evidenceInput, null, 2)}

## 출력 규칙
- 반드시 아래 JSON 형식으로만 출력하세요. 설명, 마크다운, 코드블록 없이 순수 JSON만.
- summary: 한국어 2문장 이내. 현재 상황을 운영자가 바로 이해할 수 있게.
- suggestedAction: 구체적인 확인/조치 사항. "~확인 필요", "~점검 요청" 형태로 실행 가능하게.
- 증거 리뷰에 있는 내용만 기반으로 작성하세요. 추측하거나 없는 정보를 만들지 마세요.

## 출력 형식
{"owner":"<team>","summary":"<상황 요약>","suggestedAction":"<구체적 조치 사항>"}`;
}
