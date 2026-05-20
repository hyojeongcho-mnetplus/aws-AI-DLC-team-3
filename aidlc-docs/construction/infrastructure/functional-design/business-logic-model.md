# Unit 5: Infrastructure — Business Logic Model

## AWS 리소스 목록

### Lambda Functions

| 함수 | 메모리 | Timeout | 트리거 |
|------|--------|---------|--------|
| IngestFunction | 512MB | 60s | EventBridge + API Gateway |
| ApiFunction | 256MB | 10s | API Gateway |
| DashboardFunction | 128MB | 5s | API Gateway |

### API Gateway

```
API: FanFrictionRadarApi (REST API)

Routes:
  POST /api/ingest → IngestFunction
  GET  /api/issues → ApiFunction
  GET  /api/issues/{clusterId} → ApiFunction
  POST /api/actions/{clusterId} → ApiFunction
  GET  /api/health → ApiFunction
  GET  /{proxy+} → DashboardFunction (정적 파일)
```

### EventBridge Scheduler

```
Schedule: rate(30 minutes)
Target: IngestFunction
Retry: 2회
DLQ: IngestDLQ (SQS)
```

### DynamoDB

```
Table: FanFrictionRadar
  BillingMode: PAY_PER_REQUEST
  PK: String (partition key)
  SK: String (sort key)
  TTL: expiresAt
  GSI1: GSI1PK, GSI1SK (optional)
```

### S3

```
Bucket: fan-friction-radar-raw-{accountId}
  Encryption: AES-256 (SSE-S3)
  PublicAccess: Block all
  Lifecycle: 90일 후 Glacier 이동 (optional)
```

### SQS (DLQ)

```
Queue: IngestDLQ
  MessageRetention: 14일
  VisibilityTimeout: 60s
```

## IAM Policies (Least Privilege)

### IngestFunction Role

```
- dynamodb:PutItem, BatchWriteItem, GetItem, BatchGetItem, Query (FanFrictionRadar)
- s3:PutObject (fan-friction-radar-raw-*)
- bedrock:InvokeModel (claude-4-sonnet)
- sqs:SendMessage (IngestDLQ)
```

### ApiFunction Role

```
- dynamodb:GetItem, BatchGetItem, Query (FanFrictionRadar)
- dynamodb:PutItem (ACTION# items only — condition)
- bedrock:InvokeModel (claude-4-sonnet)
```

### DashboardFunction Role

```
- (없음 — 정적 파일 서빙만)
```

## 환경 변수

```
DYNAMODB_TABLE_NAME=FanFrictionRadar
S3_BUCKET_NAME=fan-friction-radar-raw-{accountId}
BEDROCK_MODEL_ID=anthropic.claude-4-sonnet-20260514-v1:0
BEDROCK_REGION=us-east-1
APP_STORE_APP_ID=<mnet-plus-app-id>
GOOGLE_PLAY_PACKAGE=<mnet-plus-package>
```
