# Unit 4: Dashboard UI — Business Rules

## 디자인 규칙

- Severity-first operations command center 스타일
- SaaS 랜딩 페이지처럼 보이면 안 됨
- P1 이슈가 시각적으로 가장 눈에 띄어야 함
- 다크 톤 배경 + 상태별 색상 강조

## 폴링 규칙

- 간격: 30초 (설정 가능)
- 탭 비활성 시: 폴링 중지
- 네트워크 에러 시: 3회 재시도 후 에러 화면
- 성공 시: 이전 에러 상태 클리어

## 에러 표시 규칙

- API 실패: 전체 에러 화면 (fallback 데이터 없음)
- 부분 실패 (health만 실패): 해당 영역만 에러 표시
- 재시도 버튼 항상 제공

## Badge 색상

| Badge | 색상 |
|-------|------|
| LIVE | green |
| BLOCKED | red |
| STALE | yellow |
| AI_ENHANCED | blue |
| DETERMINISTIC | gray |
| NEEDS_REVIEW | orange |
| P1 | red |
| P2 | orange |
| P3 | yellow |
| P4 | gray |

## Redaction 규칙

- 리뷰 원본 body: 최대 100자 표시 + "..."
- 작성자 ID: 앞 3자 + "***"
- 링크: 표시하되 새 탭으로 열기

## 접근성

- 색상만으로 상태 구분하지 않음 (텍스트 라벨 병행)
- 키보드 네비게이션 지원
- 적절한 aria-label
