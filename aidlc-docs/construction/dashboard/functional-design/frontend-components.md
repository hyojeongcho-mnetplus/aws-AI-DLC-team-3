# Unit 4: Dashboard UI — Frontend Components

## 페이지 구조

```
App
├── CommandCenter (메인 페이지)
│   ├── SourceHealthRail
│   ├── RisingIssuesList
│   ├── IssueFeed
│   └── IssueDetail (선택 시)
│       ├── EvidencePanel
│       └── ActionBriefPanel
└── ErrorScreen (에러 시)
```

## 컴포넌트 상세

### CommandCenter

- 상태: selectedClusterId, filters, isLoading, error
- 폴링: 30초 간격으로 /api/issues + /api/health 호출
- 에러 시: ErrorScreen 표시

### SourceHealthRail

- Props: sources: SourceHealth[]
- 표시: 각 source의 status badge (LIVE/BLOCKED/STALE)
- 색상: LIVE=green, BLOCKED=red, STALE=yellow

### RisingIssuesList

- Props: issues: ClusterSnapshot[], filters, onSelect
- 표시: severity 순 정렬, 카드 형태
- 필터: 기능 분류, 이슈 타입, 에러 등급 드롭다운
- 클릭: onSelect(clusterId)

### IssueDetail

- Props: clusterId
- API 호출: GET /api/issues/{clusterId}
- 하위: EvidencePanel + ActionBriefPanel

### EvidencePanel

- Props: evidence: ProcessedReview[]
- 표시: 리뷰 요약, 출처 badge, 등록 시간
- 원본 body는 redacted (앞 100자 + "...")

### ActionBriefPanel

- Props: actionBrief?: ActionBrief, clusterId
- 표시: owner, summary, suggestedAction, aiMode badge
- 버튼: "재생성" → POST /api/actions/{clusterId}

### ErrorScreen

- Props: error: string
- 표시: 에러 메시지 + 재시도 버튼

## 상태 관리

- React useState + useEffect (단순 구조)
- 폴링: setInterval + cleanup
- API 호출: fetch wrapper with error handling

## API 연동

| 컴포넌트 | 엔드포인트 | 주기 |
|----------|-----------|------|
| CommandCenter | GET /api/issues | 30초 폴링 |
| CommandCenter | GET /api/health | 30초 폴링 |
| IssueDetail | GET /api/issues/{id} | 선택 시 1회 |
| ActionBriefPanel | POST /api/actions/{id} | 버튼 클릭 시 |
