# Component Dependencies

## Dependency Matrix

```
                  Shared Layer  S3  DynamoDB  Bedrock  API Gateway  EventBridge
Ingest Lambda        ✓          ✓     ✓        ✓         ✓            ✓
API Lambda           ✓          -     ✓        ✓         ✓            -
Dashboard Lambda     -          -     -        -         ✓            -
Dashboard UI         -          -     -        -         (via API)    -
```

## Data Flow

```
[EventBridge / API Gateway]
        |
        v
+------------------+
|  Ingest Lambda   |
+------------------+
        |
   +---------+-----------+
   |         |           |
   v         v           v
 [S3]   [Bedrock]   [DynamoDB]
  raw    classify     processed
  data   + summarize  results
                         |
                         v
              +------------------+
              |   API Lambda     |
              +------------------+
                         |
                         v
              +------------------+
              | Dashboard Lambda |
              | (static serve)   |
              +------------------+
                         |
                         v
              +------------------+
              |  Dashboard UI    |
              |  (React SPA)    |
              +------------------+
```

## Communication Patterns

| From | To | Pattern | Protocol |
|------|----|---------|----------|
| EventBridge | Ingest Lambda | Event trigger | AWS Event |
| API Gateway | Ingest Lambda | HTTP trigger | POST /api/ingest |
| API Gateway | API Lambda | HTTP proxy | REST |
| API Gateway | Dashboard Lambda | HTTP proxy | GET /* |
| Ingest Lambda | S3 | SDK call | AWS SDK v3 |
| Ingest Lambda | Bedrock | SDK call | AWS SDK v3 |
| Ingest Lambda | DynamoDB | SDK call | AWS SDK v3 |
| API Lambda | DynamoDB | SDK call | AWS SDK v3 |
| API Lambda | Bedrock | SDK call | AWS SDK v3 (action brief 재생성) |
| Dashboard UI | API Lambda | HTTP | fetch (polling) |

## Shared Layer 의존 구조

```
shared/
├── types/          ← 모든 Lambda에서 import
├── clients/
│   ├── dynamodb.ts ← Ingest Lambda, API Lambda
│   ├── s3.ts       ← Ingest Lambda
│   └── bedrock.ts  ← Ingest Lambda, API Lambda
├── repository/     ← Ingest Lambda, API Lambda
└── constants/      ← 모든 Lambda, Dashboard UI
```
