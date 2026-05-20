# Unit 3: API — Business Logic Model

## 라우팅

```
handler(event: APIGatewayProxyEvent) → APIGatewayProxyResult
  - GET /api/issues → getIssues(queryParams)
  - GET /api/issues/{clusterId} → getIssueDetail(clusterId)
  - POST /api/actions/{clusterId} → createActionBrief(clusterId)
  - GET /api/health → getSourceHealth()
  - 그 외 → 404
```

## 엔드포인트 로직

### GET /api/issues

```
getIssues(params: { category?, issueType?, errorLevel?, limit? }) → ClusterSnapshot[]
  1. Input validation (허용된 값만)
  2. ClusterRepository.getClusters(category, limit)
  3. issueType/errorLevel 필터 적용 (메모리)
  4. 응답 반환
```

### GET /api/issues/{clusterId}

```
getIssueDetail(clusterId: string) → IssueDetail
  1. ClusterRepository.getClusterById(clusterId)
  2. 없으면 404
  3. ReviewRepository.getReviewsByCluster(cluster.recentReviewIds)
  4. ActionBriefRepository.getLatestActionBrief(clusterId)
  5. 조합하여 IssueDetail 반환
```

### POST /api/actions/{clusterId}

```
createActionBrief(clusterId: string) → ActionBrief
  1. ClusterRepository.getClusterById(clusterId)
  2. 없으면 404
  3. ReviewRepository.getReviewsByCluster(cluster.recentReviewIds)
  4. BedrockClient.invoke(actionBriefPrompt, reviews)
     - 실패 시: fallback brief 생성
  5. ActionBriefRepository.putActionBrief(brief)
  6. 반환
```

### GET /api/health

```
getSourceHealth() → SourceHealth[]
  1. SourceHealthRepository.getAllSourceHealth()
  2. 반환
```

## 에러 응답 형식

```typescript
interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
```

- 400: Input validation 실패
- 404: 리소스 없음
- 500: 내부 에러 (상세 숨김)
