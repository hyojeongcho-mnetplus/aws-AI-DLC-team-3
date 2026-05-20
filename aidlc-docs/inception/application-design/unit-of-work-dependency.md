# Unit of Work — Dependency Matrix

## 의존성 매트릭스

```
              Unit 1      Unit 2      Unit 3      Unit 4
              (Shared)    (Ingest)    (API)       (Dashboard)
Unit 1         -           -           -           -
Unit 2         ✓           -           -           -
Unit 3         ✓           -           -           -
Unit 4         -           -           ✓(HTTP)     -
```

## 의존 관계 설명

| From | To | 관계 | 설명 |
|------|----|------|------|
| Unit 2 (Ingest) | Unit 1 (Shared) | 빌드 의존 | 타입, 클라이언트, repository import |
| Unit 3 (API) | Unit 1 (Shared) | 빌드 의존 | 타입, repository import |
| Unit 4 (Dashboard) | Unit 3 (API) | 런타임 의존 | HTTP fetch (polling) |
| Unit 4 (Dashboard) | Unit 1 (Shared) | 타입 의존 | 공유 타입 import (응답 타입 등) |

## 작업 순서

```
Wave 1: Unit 1 (Shared Foundation) — 모든 팀원 함께 30~45분
         ↓
Wave 2: Unit 2, Unit 3, Unit 4 — 병렬 진행
         ↓
Wave 3: 통합 테스트 + 데모 준비
```

## 병렬 작업 가능 여부

| Unit | 병렬 가능 시점 | 조건 |
|------|---------------|------|
| Unit 1 | 즉시 | 없음 (최우선) |
| Unit 2 | Unit 1 완료 후 | shared 타입/클라이언트 안정화 |
| Unit 3 | Unit 1 완료 후 | shared 타입/repository 안정화 |
| Unit 4 | Unit 1 완료 후 | API 응답 타입 합의 (mock 가능) |

## 통합 포인트

| 통합 | 관련 Unit | 검증 방법 |
|------|-----------|-----------|
| Ingest → DynamoDB | Unit 1 + Unit 2 | seed 데이터로 DynamoDB 저장 확인 |
| API → DynamoDB | Unit 1 + Unit 3 | DynamoDB에서 조회 확인 |
| Dashboard → API | Unit 3 + Unit 4 | 폴링으로 데이터 표시 확인 |
| End-to-end | 전체 | Ingest 실행 → 대시보드에 P1 이슈 표시 |
