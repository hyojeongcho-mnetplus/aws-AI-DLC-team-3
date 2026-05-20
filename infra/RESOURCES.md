# Infrastructure Resources

배포된 AWS 리소스 정보입니다. 각 유닛 개발 시 참고하세요.

## Region
- **us-east-1**

## API Gateway

| 항목 | 값 |
|------|-----|
| Endpoint | `https://j33mine5u1.execute-api.us-east-1.amazonaws.com/api` |
| API Key | AWS Console 또는 `aws apigateway get-api-keys --include-values` 로 조회 |
| 인증 | `x-api-key` 헤더 필수 |

### Routes

| Method | Path | Lambda |
|--------|------|--------|
| POST | /api/ingest | ffr-ingest |
| GET | /api/issues | ffr-api |
| GET | /api/issues/{clusterId} | ffr-api |
| POST | /api/actions/{clusterId} | ffr-api |
| GET | /api/health | ffr-api |
| GET | / , /{proxy+} | ffr-dashboard |

## Lambda Functions

| 함수명 | ARN | 메모리 | Timeout |
|--------|-----|--------|---------|
| ffr-ingest | `arn:aws:lambda:us-east-1:280500950349:function:ffr-ingest` | 512MB | 60s |
| ffr-api | `arn:aws:lambda:us-east-1:280500950349:function:ffr-api` | 256MB | 10s |
| ffr-dashboard | `arn:aws:lambda:us-east-1:280500950349:function:ffr-dashboard` | 128MB | 5s |

## DynamoDB

| 항목 | 값 |
|------|-----|
| Table Name | `FanFrictionRadar` |
| ARN | `arn:aws:dynamodb:us-east-1:280500950349:table/FanFrictionRadar` |
| Billing | PAY_PER_REQUEST |
| Key Schema | PK (String) / SK (String) |
| GSI | GSI1 (GSI1PK / GSI1SK) |
| TTL | `expiresAt` |

## S3

| 항목 | 값 |
|------|-----|
| Bucket Name | `ffr-raw-reviews-280500950349` |
| ARN | `arn:aws:s3:::ffr-raw-reviews-280500950349` |
| Encryption | AES-256 (SSE-S3) |
| Public Access | 전면 차단 |

## SQS (DLQ)

| 항목 | 값 |
|------|-----|
| Queue Name | `ffr-ingest-dlq` |
| ARN | `arn:aws:sqs:us-east-1:280500950349:ffr-ingest-dlq` |

## Bedrock

| 항목 | 값 |
|------|-----|
| Model ID | `anthropic.claude-4-sonnet-20260514-v1:0` |
| Region | `us-east-1` |

## 환경변수 (Lambda에 자동 주입)

```
DYNAMODB_TABLE_NAME=FanFrictionRadar
S3_BUCKET_NAME=ffr-raw-reviews-280500950349
BEDROCK_MODEL_ID=anthropic.claude-4-sonnet-20260514-v1:0
BEDROCK_REGION=us-east-1
APP_STORE_APP_ID=1653240982
GOOGLE_PLAY_PACKAGE=com.cjenm.mnetplus
```

## 로컬 개발 시

`.env` 파일에 위 환경변수를 설정하면 로컬에서도 실제 리소스에 접근 가능합니다.

```bash
# API 호출 예시
curl -H "x-api-key: <YOUR_API_KEY>" https://j33mine5u1.execute-api.us-east-1.amazonaws.com/api/api/health
```
