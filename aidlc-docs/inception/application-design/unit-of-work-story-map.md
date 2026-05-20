# Unit of Work — 요구사항 매핑

User Stories를 건너뛰었으므로 Functional Requirements를 Unit에 매핑합니다.

## FR → Unit 매핑

| FR | 설명 | Unit |
|----|------|------|
| FR-01 | 리뷰 수집 (Connectors) | Unit 2 (Ingest) |
| FR-02 | 원본 데이터 저장 (S3) | Unit 2 (Ingest) |
| FR-03 | AI 분류 및 요약 (Bedrock) | Unit 2 (Ingest) + Unit 1 (Shared: Bedrock client) |
| FR-04 | 처리 결과 저장 (DynamoDB) | Unit 1 (Shared: repository) + Unit 2 (Ingest) |
| FR-05 | 대시보드 UI | Unit 4 (Dashboard) |
| FR-06 | Source Health | Unit 1 (Shared: types) + Unit 2 (write) + Unit 3 (read API) + Unit 4 (display) |
| FR-07 | 주기적 수집 및 알림 | Unit 2 (Ingest) + infra (EventBridge) |

## NFR → Unit 매핑

| NFR | Unit |
|-----|------|
| NFR-01 (Resilience) | Unit 2 (에러 처리/재시도) |
| NFR-02 (성능) | Unit 3 (DynamoDB 조회 최적화) + Unit 4 (폴링 간격) |
| NFR-03 (보안) | 전체 (Security Extension 적용) |
| NFR-04 (테스트) | 전체 (Vitest + fast-check) |
| NFR-05 (배포) | infra/ (Lambda + API Gateway + EventBridge) |

## 팀 역할 매핑 (4명 기준)

| 역할 | Unit | 주요 작업 |
|------|------|-----------|
| Person A | Unit 1 (Shared) + Unit 2 (Ingest) | DynamoDB, S3, repository, 수집 파이프라인 |
| Person B | Unit 2 (Ingest) | Connectors, Bedrock 연동, 에러 처리 |
| Person C | Unit 3 (API) | REST API, 조회 로직, input validation |
| Person D | Unit 4 (Dashboard) | React UI, 대시보드, 폴링, 에러 화면 |
