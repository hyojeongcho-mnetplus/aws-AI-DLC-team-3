# Unit 2: Ingest Pipeline — Business Logic Model

## 메인 핸들러 흐름

```
handler(event)
  1. 트리거 타입 판별 (EventBridge vs API Gateway)
  2. 각 source에 대해 수집 실행:
     a. fetchReviews(source)
     b. deduplicateReviews(reviews)
     c. saveRawToS3(reviews, source)
     d. processWithBedrock(reviews)
        - 실패 시: fallbackClassify(reviews)
     e. saveProcessedToDynamoDB(processed)
     f. updateClusterSnapshots(processed)
     g. updateSourceHealth(source, SUCCESS)
  3. 에러 발생 시:
     - updateSourceHealth(source, BLOCKED)
     - throw (Lambda 재시도 또는 DLQ)
```

## Connector 로직

### App Store RSS Connector

```
fetchAppStoreReviews(appId: string) → ReviewEvent[]
  1. RSS Feed URL 구성: https://itunes.apple.com/kr/rss/customerreviews/id={appId}/json
  2. HTTP GET (timeout: 10s, retry: 3회 exponential backoff)
  3. JSON 파싱
  4. 각 entry를 ReviewEvent로 변환:
     - id: generateReviewId('appstore', entry.id)
     - source: 'appstore'
     - sourceReviewId: entry.id
     - sourceUrl: entry.link
     - author: entry.author.name
     - rating: entry['im:rating']
     - title: entry.title
     - body: entry.content
     - language: 'ko' (또는 feed에서 추출)
     - createdAt: entry.updated
     - collectedAt: now()
  5. 실패 시 에러 throw
```

### Google Play Connector

```
fetchGooglePlayReviews(appId: string) → ReviewEvent[]
  1. Google Play 리뷰 페이지 또는 API 호출
  2. HTTP GET (timeout: 10s, retry: 3회)
  3. 응답 파싱
  4. 각 리뷰를 ReviewEvent로 변환:
     - id: generateReviewId('googleplay', review.reviewId)
     - source: 'googleplay'
     - sourceReviewId: review.reviewId
     - sourceUrl: 구성된 URL
     - author: review.userName
     - rating: review.score
     - body: review.text
     - language: review.language
     - createdAt: review.date
     - collectedAt: now()
  5. 실패 시 에러 throw
```

## 중복 제거

```
deduplicateReviews(reviews: ReviewEvent[]) → ReviewEvent[]
  1. 입력 배열 내 중복 제거 (id 기준 Set)
  2. DynamoDB에 이미 존재하는 id 조회 (BatchGet)
  3. 이미 존재하는 id 제외
  4. 새로운 리뷰만 반환
```

## Bedrock 처리

```
processWithBedrock(reviews: ReviewEvent[]) → ProcessedReview[]
  1. 리뷰를 배치로 묶음 (최대 20개씩)
  2. 각 배치에 대해 Bedrock 호출:
     - 프롬프트: Unit 6에서 정의한 분류/요약 프롬프트
     - 입력: 리뷰 body + metadata
     - 기대 출력: { category, issueType, errorLevel?, summary }
  3. 응답 JSON 파싱 + 타입 검증
  4. ProcessedReview로 변환 (aiMode: 'AI_ENHANCED')
  5. 반환
```

## Fallback 분류

```
fallbackClassify(reviews: ReviewEvent[]) → ProcessedReview[]
  1. 각 리뷰 body에서 keyword 매칭:
     - 투표/vote/voting → VOTE
     - 광고/ad/ads → ADS
     - 결제/payment/pay/포인트 → PAYMENT
     - 라이브/live/영상/video → LIVE_VIDEO
     - 그 외 → OTHER
  2. issueType: 기본 ERROR (keyword로 판별 불가)
  3. errorLevel: 기본 2 (CAN_WAIT)
  4. summary: body 앞 50자 + "..."
  5. aiMode: 'DETERMINISTIC'
  6. 반환
```

## Cluster 업데이트

```
updateClusterSnapshots(processed: ProcessedReview[]) → void
  1. category별로 그룹핑
  2. 각 그룹에서 유사 이슈 클러스터링 (title 유사도 또는 category+issueType 조합)
  3. 기존 cluster가 있으면 reviewCount 증가 + updatedAt 갱신
  4. 없으면 새 cluster 생성
  5. severity 계산:
     - errorLevel 1 + reviewCount >= 5 → P1
     - errorLevel 1 + reviewCount < 5 → P2
     - errorLevel 2 → P3
     - errorLevel 3 또는 이슈아님 → P4
  6. DynamoDB에 저장
```
