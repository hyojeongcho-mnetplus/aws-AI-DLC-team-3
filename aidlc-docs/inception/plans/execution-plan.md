# Execution Plan

## Detailed Analysis Summary

### Change Impact Assessment
- **User-facing changes**: Yes — 운영자 대시보드 신규 구축
- **Structural changes**: Yes — 전체 시스템 신규 설계 (Lambda 기반 서버리스)
- **Data model changes**: Yes — DynamoDB single-table, S3 raw storage
- **API changes**: Yes — REST API 신규 설계
- **NFR impact**: Yes — 보안, 성능, 가용성 모두 해당

### Risk Assessment
- **Risk Level**: Medium
- **Rollback Complexity**: Easy (Greenfield, 기존 시스템 없음)
- **Testing Complexity**: Moderate (Bedrock 연동, 외부 API 의존)

---

## Workflow Visualization

### Text Alternative

```
Phase 1: INCEPTION
  - Workspace Detection (COMPLETED)
  - Reverse Engineering (SKIP - Greenfield)
  - Requirements Analysis (COMPLETED)
  - User Stories (SKIP - 해커톤, 요구사항 충분히 명확)
  - Workflow Planning (IN PROGRESS)
  - Application Design (EXECUTE)
  - Units Generation (EXECUTE)

Phase 2: CONSTRUCTION (per-unit)
  - Functional Design (EXECUTE)
  - NFR Requirements (EXECUTE)
  - NFR Design (SKIP - NFR Requirements에서 충분히 커버)
  - Infrastructure Design (EXECUTE)
  - Code Generation (EXECUTE - ALWAYS)
  - Build and Test (EXECUTE - ALWAYS)

Phase 3: OPERATIONS
  - Operations (PLACEHOLDER)
```

---

## Phases to Execute

### 🔵 INCEPTION PHASE
- [x] Workspace Detection (COMPLETED)
- [x] Reverse Engineering (SKIP - Greenfield)
- [x] Requirements Analysis (COMPLETED)
- [x] User Stories (SKIP)
  - **Rationale**: 해커톤 프로젝트, 요구사항이 팀 문서+PR 코멘트로 충분히 명확, 단일 사용자 타입(운영자)
- [x] Workflow Planning (IN PROGRESS)
- [ ] Application Design - **EXECUTE**
  - **Rationale**: 새로운 컴포넌트/서비스 다수 필요 (Ingest Lambda, API Lambda, Dashboard Lambda, Bedrock 연동). 컴포넌트 간 의존성과 인터페이스 정의 필요.
- [ ] Units Generation - **EXECUTE**
  - **Rationale**: 3개 Lambda + UI + 공유 레이어로 분해 필요. 4명 팀 병렬 작업을 위한 단위 분리.

### 🟢 CONSTRUCTION PHASE (per-unit)
- [ ] Functional Design - **EXECUTE**
  - **Rationale**: DynamoDB 스키마, Bedrock 프롬프트, 분류 로직 등 비즈니스 규칙 상세 설계 필요
- [ ] NFR Requirements - **EXECUTE**
  - **Rationale**: 보안(Security Extension), 성능, Lambda 설정 등 NFR 구체화 필요
- [ ] NFR Design - **SKIP**
  - **Rationale**: NFR Requirements에서 Lambda 기반 서버리스 패턴이 명확하여 별도 NFR Design 불필요
- [ ] Infrastructure Design - **EXECUTE**
  - **Rationale**: Lambda, API Gateway, EventBridge, S3, DynamoDB, Bedrock 인프라 매핑 필요
- [ ] Code Generation - **EXECUTE** (ALWAYS)
  - **Rationale**: 구현 코드 생성
- [ ] Build and Test - **EXECUTE** (ALWAYS)
  - **Rationale**: 빌드/테스트 지침 생성

### 🟡 OPERATIONS PHASE
- [ ] Operations - PLACEHOLDER

---

## Estimated Timeline
- **Total Stages to Execute**: 8 (Application Design, Units Generation, Functional Design, NFR Requirements, Infrastructure Design, Code Generation, Build and Test)
- **Stages to Skip**: 4 (Reverse Engineering, User Stories, NFR Design, Operations)

## Success Criteria
- **Primary Goal**: Mnet Plus Fan Friction Radar MVP 완성 — 리뷰 수집부터 대시보드 표시까지 end-to-end 동작
- **Key Deliverables**:
  - Ingest Lambda (수집 + S3 저장)
  - Bedrock 분류/요약 처리
  - DynamoDB 저장 및 조회
  - API Lambda (대시보드 데이터 제공)
  - Dashboard Lambda (정적 페이지 서빙)
  - Vite + React 대시보드 UI
- **Quality Gates**:
  - Vitest 단위 테스트 통과
  - fast-check PBT (순수 함수) 통과
  - Security Extension 규칙 준수
  - "Ads blocking vote completion" P1 이슈가 대시보드에 표시
