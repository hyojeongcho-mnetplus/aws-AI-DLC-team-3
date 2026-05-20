# Application Components

## 1. Ingest Lambda

**목적**: 외부 소스에서 리뷰를 수집하고 S3에 원본 저장 후 Bedrock 처리를 트리거

**책임**:
- App Store RSS Feed에서 리뷰 수집
- Google Play에서 리뷰 수집
- 원본 데이터를 S3에 저장
- 중복 제거 (hash 기반)
- ReviewEvent로 정규화
- Bedrock 처리 파이프라인 호출
- Source health 상태 업데이트

**트리거**:
- EventBridge Scheduler (자동, 주기적)
- API Gateway POST /api/ingest (수동)

---

## 2. API Lambda

**목적**: 대시보드에 데이터를 제공하는 REST API

**책임**:
- DynamoDB에서 issues/clusters 조회
- Issue detail + evidence 조회
- Action brief 조회/재생성
- Source health 조회

**엔드포인트**:
- GET /api/issues
- GET /api/issues/[clusterId]
- POST /api/actions/[clusterId]
- GET /api/health

---

## 3. Dashboard Lambda

**목적**: Vite 빌드된 정적 페이지를 서빙

**책임**:
- 정적 파일 (HTML, JS, CSS) 서빙
- SPA 라우팅 지원

---

## 4. Dashboard UI (Vite + React)

**목적**: 운영자용 severity-first 커맨드 센터 대시보드

**책임**:
- Source health rail 표시
- Rising issues 목록 (severity 순)
- Issue detail (evidence + action brief)
- 기능 분류/이슈 타입/에러 등급 필터
- 폴링 기반 자동 갱신
- 에러 상태 화면 표시

---

## 5. Shared Layer

**목적**: Lambda 간 공유되는 타입, 유틸리티, 클라이언트

**책임**:
- ReviewEvent, ReviewSource 등 도메인 타입 정의
- DynamoDB 클라이언트 및 repository
- S3 클라이언트
- Bedrock 클라이언트
- 분류 카테고리/이슈 타입/에러 등급 상수
