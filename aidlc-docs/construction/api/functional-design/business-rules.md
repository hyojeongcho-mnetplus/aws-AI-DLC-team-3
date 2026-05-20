# Unit 3: API — Business Rules

## Input Validation

- category: FEATURE_CATEGORY 값 중 하나만 허용
- issueType: ISSUE_TYPE 값 중 하나만 허용
- errorLevel: 1, 2, 3만 허용
- limit: 1~100 정수 (기본 20)
- clusterId: 영숫자 12자

## 응답 규칙

- 성공: 200 + JSON body
- 생성: 201 + JSON body (POST /api/actions)
- 에러: 적절한 status code + ApiErrorResponse
- 모든 응답에 CORS 헤더 포함
- 모든 응답에 Security 헤더 포함 (SECURITY-04)

## 보안 헤더 (모든 응답)

```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

## Rate Limiting

- API Gateway 레벨에서 throttling 설정
- 기본: 100 req/s burst, 50 req/s sustained

## Action Brief 재생성 규칙

- 같은 clusterId에 대해 재생성 요청 시 새 버전으로 저장
- 이전 버전은 유지 (히스토리)
- Bedrock 실패 시 fallback brief:
  - summary: cluster.title + " 관련 이슈 " + reviewCount + "건"
  - suggestedAction: "담당팀 확인 필요"
  - aiMode: DETERMINISTIC
