import {
  type ReviewEvent,
  type ProcessedReview,
  type FeatureCategory,
  FEATURE_CATEGORY,
  ISSUE_TYPE,
  ERROR_LEVEL,
  AI_MODE,
  invokeModel,
  buildClassificationPrompt,
  createLogger,
} from '@ffr/shared';

const logger = createLogger('classification-service');
const BATCH_SIZE = 20;

export async function classifyReviews(reviews: ReviewEvent[]): Promise<ProcessedReview[]> {
  try {
    return await classifyWithBedrock(reviews);
  } catch (err) {
    logger.warn('bedrock failed, using fallback', { error: String(err) });
    return fallbackClassify(reviews);
  }
}

async function classifyWithBedrock(reviews: ReviewEvent[]): Promise<ProcessedReview[]> {
  const results: ProcessedReview[] = [];

  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    const batch = reviews.slice(i, i + BATCH_SIZE);
    const prompt = buildClassificationPrompt(batch);

    let attempt = 0;
    let response: string | undefined;
    while (attempt < 2) {
      try {
        response = await invokeModel(prompt);
        break;
      } catch (err) {
        attempt++;
        if (attempt >= 2) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const parsed = JSON.parse(response!);
    const now = new Date().toISOString();

    for (const r of parsed.results) {
      const review = batch.find((b) => b.id === r.reviewId);
      if (!review) continue;
      results.push({
        ...review,
        category: r.category,
        issueType: r.issueType,
        errorLevel: r.errorLevel,
        summary: r.summary,
        aiMode: AI_MODE.AI_ENHANCED,
        processedAt: now,
      });
    }
  }
  return results;
}

const KEYWORD_MAP: Record<string, FeatureCategory> = {
  투표: FEATURE_CATEGORY.VOTE, vote: FEATURE_CATEGORY.VOTE, voting: FEATURE_CATEGORY.VOTE,
  광고: FEATURE_CATEGORY.ADS, ad: FEATURE_CATEGORY.ADS, ads: FEATURE_CATEGORY.ADS,
  결제: FEATURE_CATEGORY.PAYMENT, payment: FEATURE_CATEGORY.PAYMENT, 포인트: FEATURE_CATEGORY.PAYMENT,
  라이브: FEATURE_CATEGORY.LIVE_VIDEO, live: FEATURE_CATEGORY.LIVE_VIDEO, 영상: FEATURE_CATEGORY.LIVE_VIDEO,
};

export function fallbackClassify(reviews: ReviewEvent[]): ProcessedReview[] {
  const now = new Date().toISOString();
  return reviews.map((r) => ({
    ...r,
    category: detectCategory(r.body),
    issueType: ISSUE_TYPE.ERROR,
    errorLevel: ERROR_LEVEL.CAN_WAIT,
    summary: r.body.slice(0, 50) + (r.body.length > 50 ? '...' : ''),
    aiMode: AI_MODE.DETERMINISTIC,
    processedAt: now,
  }));
}

function detectCategory(text: string): FeatureCategory {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return FEATURE_CATEGORY.OTHER;
}
