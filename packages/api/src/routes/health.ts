import type { APIGatewayProxyResult } from 'aws-lambda';
import { sourceHealthRepo } from '@ffr/shared';

export async function handleGetHealth(): Promise<APIGatewayProxyResult> {
  const sources = await sourceHealthRepo.getAllSourceHealth();
  return {
    statusCode: 200,
    body: JSON.stringify(sources),
  };
}
