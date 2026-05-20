# Infrastructure Design

## 아키텍처 다이어그램

```
                    +-------------------+
                    | EventBridge       |
                    | (rate 30min)      |
                    +--------+----------+
                             |
                             v
+-------------------+   +-------------------+   +-------------------+
| API Gateway       |-->| Ingest Lambda     |-->| S3 Bucket         |
| POST /api/ingest  |   | (512MB, 60s)      |   | (raw reviews)     |
+-------------------+   +--------+----------+   +-------------------+
                                 |
                                 v
                        +-------------------+
                        | Bedrock           |
                        | (Claude 4 Sonnet) |
                        +--------+----------+
                                 |
                                 v
+-------------------+   +-------------------+
| API Gateway       |-->| DynamoDB          |
| GET /api/*        |   | (FanFrictionRadar)|
+--------+----------+   +-------------------+
         |                       ^
         v                       |
+-------------------+   +--------+----------+
| API Lambda        |-->|                    |
| (256MB, 10s)      |   +-------------------+
+-------------------+

+-------------------+   +-------------------+
| API Gateway       |-->| Dashboard Lambda  |
| GET /*            |   | (128MB, 5s)       |
+-------------------+   +-------------------+

+-------------------+
| SQS (DLQ)         |
| IngestDLQ         |
+-------------------+

+-------------------+
| CloudWatch        |
| Logs + Alarms     |
+-------------------+
```

## IaC 선택: AWS SAM

해커톤 시간 제약상 SAM (Serverless Application Model) 사용. CDK보다 빠르게 셋업 가능.

## template.yaml 구조

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 10
    Environment:
      Variables:
        DYNAMODB_TABLE_NAME: !Ref FanFrictionRadarTable
        S3_BUCKET_NAME: !Ref RawReviewsBucket
        BEDROCK_MODEL_ID: anthropic.claude-4-sonnet-20260514-v1:0

Resources:
  # --- Lambda Functions ---
  IngestFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: packages/ingest/dist/handler.handler
      MemorySize: 512
      Timeout: 60
      Events:
        Schedule:
          Type: ScheduleV2
          Properties:
            ScheduleExpression: rate(30 minutes)
        ManualTrigger:
          Type: Api
          Properties:
            Path: /api/ingest
            Method: POST
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt IngestDLQ.Arn
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref FanFrictionRadarTable
        - S3WritePolicy:
            BucketName: !Ref RawReviewsBucket
        - Statement:
            Effect: Allow
            Action: bedrock:InvokeModel
            Resource: '*'

  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: packages/api/dist/handler.handler
      MemorySize: 256
      Timeout: 10
      Events:
        GetIssues:
          Type: Api
          Properties:
            Path: /api/issues
            Method: GET
        GetIssueDetail:
          Type: Api
          Properties:
            Path: /api/issues/{clusterId}
            Method: GET
        CreateAction:
          Type: Api
          Properties:
            Path: /api/actions/{clusterId}
            Method: POST
        GetHealth:
          Type: Api
          Properties:
            Path: /api/health
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref FanFrictionRadarTable
        - Statement:
            Effect: Allow
            Action:
              - dynamodb:PutItem
            Resource: !GetAtt FanFrictionRadarTable.Arn
            Condition:
              ForAllValues:StringLike:
                dynamodb:LeadingKeys: 'ACTION#*'
        - Statement:
            Effect: Allow
            Action: bedrock:InvokeModel
            Resource: '*'

  DashboardFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: packages/dashboard/dist/handler.handler
      MemorySize: 128
      Timeout: 5
      Events:
        ProxyRoute:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: GET

  # --- Storage ---
  FanFrictionRadarTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      TimeToLiveSpecification:
        AttributeName: expiresAt
        Enabled: true

  RawReviewsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # --- DLQ ---
  IngestDLQ:
    Type: AWS::SQS::Queue
    Properties:
      MessageRetentionPeriod: 1209600  # 14 days

  # --- Monitoring ---
  IngestErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref IngestFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 3
      ComparisonOperator: GreaterThanOrEqualToThreshold

Outputs:
  ApiUrl:
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod'
```

## 배포 명령어

```bash
sam build
sam deploy --guided  # 첫 배포
sam deploy           # 이후 배포
```
