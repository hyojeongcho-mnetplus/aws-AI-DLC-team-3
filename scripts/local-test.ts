/**
 * 로컬 E2E 테스트: DynamoDB Local 기반
 * 실행: npx tsx scripts/local-test.ts
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ENDPOINT = 'http://localhost:8000';
const TABLE = 'FanFrictionRadar';

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: 'ap-northeast-2',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});
const doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

async function step(name: string, fn: () => Promise<void>) {
  process.stdout.write(`[${name}] `);
  try {
    await fn();
    console.log('✅ PASS');
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

async function main() {
  console.log('\n=== Fan Friction Radar 로컬 E2E 테스트 ===\n');

  // Step 1: App Store RSS 수집 테스트 (mock fallback)
  const mockReviews = [
    { id: 'r001', body: '투표 버튼 누르면 앱이 꺼져요 진짜 짜증나요', rating: 1, author: 'user1' },
    { id: 'r002', body: '광고가 너무 많아서 투표할 때 방해됩니다', rating: 2, author: 'user2' },
    { id: 'r003', body: '결제했는데 포인트가 안 들어왔어요', rating: 1, author: 'user3' },
    { id: 'r004', body: '라이브 영상 끊김이 심합니다', rating: 2, author: 'user4' },
    { id: 'r005', body: '앱 업데이트 후 로그인이 안됩니다', rating: 1, author: 'user5' },
  ];
  await step('1. App Store RSS 수집 (mock)', async () => {
    // 실제 RSS는 빈 응답 → mock 데이터 사용
    const res = await fetch('https://itunes.apple.com/kr/rss/customerreviews/id=1653240982/json', {
      signal: AbortSignal.timeout(5_000),
    });
    const json = await res.json();
    const realEntries = json?.feed?.entry ?? [];
    if (realEntries.length > 0) {
      console.log(`(실제 ${realEntries.length}건) `);
    } else {
      console.log(`(RSS 빈 응답 → mock ${mockReviews.length}건 사용) `);
    }
  });

  // Step 2: 리뷰 데이터 DynamoDB 저장 (fallback 분류 시뮬레이션)
  await step('2. DynamoDB 리뷰 저장 + 키워드 분류', async () => {
    const KEYWORD_MAP: Record<string, string> = {
      투표: 'vote', vote: 'vote', 광고: 'ads', ad: 'ads',
      결제: 'payment', 포인트: 'payment', 라이브: 'live_video', 영상: 'live_video',
    };
    const date = new Date().toISOString().slice(0, 10);
    for (const r of mockReviews) {
      const lower = r.body.toLowerCase();
      let category = 'other';
      for (const [kw, cat] of Object.entries(KEYWORD_MAP)) {
        if (lower.includes(kw)) { category = cat; break; }
      }
      await doc.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `REVIEW#appstore#${date}`,
          SK: `${new Date().toISOString()}#${r.id}`,
          id: r.id, source: 'appstore', body: r.body, rating: r.rating,
          author: r.author, category, issueType: 'error', errorLevel: 2,
          summary: r.body.slice(0, 50), aiMode: 'DETERMINISTIC',
          processedAt: new Date().toISOString(),
        },
      }));
    }
    console.log(`(${mockReviews.length}건 분류 저장) `);
  });

  // Step 3: 리뷰 조회 확인
  await step('3. DynamoDB 리뷰 조회', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const res = await doc.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `REVIEW#appstore#${date}` },
    }));
    if (!res.Items || res.Items.length === 0) throw new Error('No items found');
    const categories = [...new Set(res.Items.map((i: any) => i.category))];
    console.log(`(${res.Items.length}건, 카테고리: ${categories.join(', ')}) `);
  });

  // Step 4: 클러스터 저장
  await step('4. 클러스터 저장', async () => {
    await doc.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'CLUSTER#other',
        SK: '2#2026-05-20T00:00:00Z#abc123def456',
        clusterId: 'abc123def456',
        category: 'other',
        title: '앱 크래시 이슈',
        issueType: 'error',
        errorLevel: 1,
        reviewCount: 5,
        severity: 2,
        recentReviewIds: ['r1', 'r2', 'r3'],
        updatedAt: new Date().toISOString(),
      },
    }));
  });

  // Step 5: 클러스터 조회 (API issues 엔드포인트 시뮬레이션)
  await step('5. 클러스터 조회 (GET /api/issues)', async () => {
    const res = await doc.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'CLUSTER#other' },
    }));
    if (!res.Items || res.Items.length === 0) throw new Error('No clusters');
    const cluster = res.Items[0];
    if (cluster.clusterId !== 'abc123def456') throw new Error('Wrong cluster');
    console.log(`(title: "${cluster.title}") `);
  });

  // Step 6: Action Brief 저장 (POST /api/actions 시뮬레이션)
  await step('6. Action Brief 저장', async () => {
    await doc.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'ACTION#abc123def456',
        SK: `VERSION#${new Date().toISOString()}`,
        clusterId: 'abc123def456',
        owner: 'unknown',
        summary: '앱 크래시 이슈 관련 5건',
        suggestedAction: '담당팀 확인 필요',
        evidence: ['r1', 'r2', 'r3'],
        aiMode: 'DETERMINISTIC',
        createdAt: new Date().toISOString(),
      },
    }));
  });

  // Step 7: Action Brief 조회
  await step('7. Action Brief 조회 (GET /api/issues/:id)', async () => {
    const res = await doc.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'ACTION#abc123def456' },
      ScanIndexForward: false,
      Limit: 1,
    }));
    if (!res.Items || res.Items.length === 0) throw new Error('No action brief');
    console.log(`(action: "${res.Items[0].suggestedAction}") `);
  });

  // Step 8: Source Health 저장/조회
  await step('8. Source Health 저장/조회', async () => {
    await doc.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'SOURCE#appstore',
        SK: 'STATUS#LATEST',
        source: 'appstore',
        status: 'LIVE',
        lastSuccessAt: new Date().toISOString(),
        reviewCount: mockReviews.length,
        updatedAt: new Date().toISOString(),
      },
    }));
    const res = await doc.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: 'SOURCE#appstore', SK: 'STATUS#LATEST' },
    }));
    if (res.Item?.status !== 'LIVE') throw new Error('Health not LIVE');
  });

  console.log('\n=== 완료 ===\n');
}

main().catch(console.error);
