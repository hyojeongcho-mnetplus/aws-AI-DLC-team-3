# Unit 2: Ingest Pipeline — Domain Entities

## Ingest 전용 타입

```typescript
// Lambda 핸들러 입력
type IngestEvent = EventBridgeEvent | APIGatewayProxyEvent;

// 수집 결과
interface IngestResult {
  source: ReviewSource;
  collected: number;
  newReviews: number;
  duplicatesSkipped: number;
  processedCount: number;
  aiMode: AiMode;
  s3Key?: string;
  errors: string[];
}

// 전체 수집 응답
interface IngestResponse {
  success: boolean;
  results: IngestResult[];
  timestamp: string;
}

// Raw review (connector에서 받은 원본, source별로 다름)
interface RawAppStoreEntry {
  id: { label: string };
  author: { name: { label: string } };
  'im:rating': { label: string };
  title: { label: string };
  content: { label: string };
  link: { attributes: { href: string } };
  updated: { label: string };
}

interface RawGooglePlayReview {
  reviewId: string;
  userName: string;
  score: number;
  text: string;
  date: string;
  url?: string;
}

// Bedrock 응답 (분류/요약 결과)
interface BedrockClassificationResult {
  reviewId: string;
  category: FeatureCategory;
  issueType: IssueType;
  errorLevel?: ErrorLevel;
  summary: string;
}

// Bedrock 배치 응답
interface BedrockBatchResponse {
  results: BedrockClassificationResult[];
}
```

## 설정값

```typescript
interface IngestConfig {
  appStoreAppId: string;        // Mnet Plus App Store ID
  googlePlayPackage: string;    // Mnet Plus 패키지명
  bedrockBatchSize: number;     // 기본 20
  dynamoBatchSize: number;      // 기본 25
  connectorTimeoutMs: number;   // 기본 10000
  bedrockTimeoutMs: number;     // 기본 30000
  staleThresholdMs: number;     // 기본 3600000 (1시간)
}
```
