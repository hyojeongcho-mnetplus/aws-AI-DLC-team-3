# Unit 3: API — Domain Entities

```typescript
// API 응답 타입
interface IssueDetail {
  cluster: ClusterSnapshot;
  evidence: ProcessedReview[];
  actionBrief?: ActionBrief;
}

interface IssuesResponse {
  issues: ClusterSnapshot[];
  total: number;
}

interface HealthResponse {
  sources: SourceHealth[];
  updatedAt: string;
}

// 쿼리 파라미터
interface IssueFilters {
  category?: FeatureCategory;
  issueType?: IssueType;
  errorLevel?: ErrorLevel;
  limit?: number;
}
```
