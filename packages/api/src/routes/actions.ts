import type { APIGatewayProxyResult } from 'aws-lambda';
import { clusterRepo, actionBriefRepo, reviewRepo, invokeModel, buildActionBriefPrompt, type ActionBrief, AI_MODE } from '@ffr/shared';
import { validateClusterId } from '../middleware/validation.js';
import { createLogger } from '@ffr/shared';

const logger = createLogger('actions');

export async function handleCreateActionBrief(clusterId: string): Promise<APIGatewayProxyResult> {
  validateClusterId(clusterId);

  const clusters = await clusterRepo.getClusters(undefined, 100);
  const cluster = clusters.find((c) => c.clusterId === clusterId);
  if (!cluster) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Not Found', message: 'Cluster not found', statusCode: 404 }) };
  }

  const evidence = await reviewRepo.getReviewsBySourceAndDate('appstore', new Date().toISOString().slice(0, 10));
  const relevant = evidence.filter((r) => cluster.recentReviewIds.includes(r.id));

  let brief: ActionBrief;
  try {
    const prompt = buildActionBriefPrompt(cluster, relevant.slice(0, 10));
    const raw = await invokeModel(prompt);
    const parsed = JSON.parse(raw);
    brief = {
      clusterId,
      owner: parsed.owner ?? 'unknown',
      summary: parsed.summary ?? cluster.title,
      suggestedAction: parsed.suggestedAction ?? '담당팀 확인 필요',
      evidence: relevant.map((r) => r.id),
      aiMode: AI_MODE.AI_ENHANCED,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('Bedrock failed, using fallback', { error: String(err) });
    brief = {
      clusterId,
      owner: 'unknown',
      summary: `${cluster.title} 관련 이슈 ${cluster.reviewCount}건`,
      suggestedAction: '담당팀 확인 필요',
      evidence: relevant.map((r) => r.id),
      aiMode: AI_MODE.DETERMINISTIC,
      createdAt: new Date().toISOString(),
    };
  }

  await actionBriefRepo.putActionBrief(brief);
  return { statusCode: 201, body: JSON.stringify(brief) };
}
