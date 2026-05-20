# Unit 6: Bedrock Prompt Engineering — Business Logic Model

## 프롬프트 목록

### 1. 분류 + 요약 프롬프트 (Classification & Summary)

**용도**: 리뷰 배치를 분류하고 요약

**입력**: ReviewEvent[] (최대 20개)

**기대 출력**:
```json
{
  "results": [
    {
      "reviewId": "abc123",
      "category": "ads",
      "issueType": "error",
      "errorLevel": 1,
      "summary": "광고 시청 후 투표가 완료되지 않는 문제"
    }
  ]
}
```

**프롬프트 구조**:
```
System: 당신은 Mnet Plus 앱 리뷰 분석가입니다.

규칙:
- category는 반드시 다음 중 하나: vote, ads, payment, live_video, other
- issueType은 반드시 다음 중 하나: error, not_an_issue, feature_request, spec_misunderstanding
- errorLevel은 issueType이 error일 때만 포함 (1=급함, 2=나중에, 3=알고만)
- summary는 한국어 1문장, 30자 이내
- JSON만 출력, 설명 없음

입력 리뷰:
{reviews JSON}

출력 형식:
{expected JSON schema}
```

### 2. Action Brief 프롬프트

**용도**: 클러스터에 대한 운영자 액션 브리프 생성

**입력**: ClusterSnapshot + ProcessedReview[] (evidence)

**기대 출력**:
```json
{
  "owner": "ads_team",
  "summary": "광고 시청 완료 후 투표 미반영 이슈가 반복 발생 중",
  "suggestedAction": "광고 SDK의 completion callback과 투표 API 연동 확인 필요. 최근 5건의 리뷰에서 동일 패턴 확인됨."
}
```

**프롬프트 구조**:
```
System: 당신은 Mnet Plus 운영팀 어시스턴트입니다.

규칙:
- owner는 담당팀 (ads_team, vote_team, payment_team, live_team, app_team)
- summary는 한국어 2문장 이내
- suggestedAction은 구체적 확인/조치 사항
- 추측하지 말고 evidence에 있는 내용만 기반으로 작성
- JSON만 출력

클러스터 정보:
{cluster JSON}

증거 리뷰:
{evidence JSON}
```

## 프롬프트 검증 규칙

- 응답이 valid JSON인지 확인
- 필수 필드 존재 여부 확인
- category/issueType/errorLevel 값이 허용 범위인지 확인
- 파싱 실패 시 1회 재시도 (프롬프트에 "JSON만 출력" 강조)
- 2회 실패 시 throw

## Fixture 데이터

```
fixtures/
├── appstore-reviews-sample.json    (iOS 535개 샘플)
├── googleplay-reviews-sample.json  (Google Play 1,479개 샘플)
├── expected-classification.json    (기대 분류 결과)
└── expected-action-brief.json      (기대 액션 브리프)
```

## 프롬프트 튜닝 기준

- 분류 정확도: fixture 데이터 대비 80% 이상 일치
- 요약 품질: 원본 리뷰 핵심 내용 포함
- Action brief: 구체적이고 실행 가능한 제안
- Hallucination 방지: evidence에 없는 내용 생성 금지
