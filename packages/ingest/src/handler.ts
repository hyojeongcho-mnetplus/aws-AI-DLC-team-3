import type { APIGatewayProxyEvent, APIGatewayProxyResult, EventBridgeEvent } from 'aws-lambda';
import { createLogger } from '@ffr/shared';
import { runIngest } from './services/ingest.service.js';

const logger = createLogger('ingest-handler');

type IngestEvent = EventBridgeEvent<string, unknown> | APIGatewayProxyEvent;

export async function handler(event: IngestEvent): Promise<APIGatewayProxyResult> {
  const trigger = isApiGateway(event) ? 'api' : 'scheduler';
  logger.info('invoked', { trigger });

  try {
    const results = await runIngest();
    return { statusCode: 200, body: JSON.stringify({ success: true, trigger, results }) };
  } catch (err) {
    logger.error('fatal', { error: String(err) });
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Internal error' }) };
  }
}

function isApiGateway(event: IngestEvent): event is APIGatewayProxyEvent {
  return 'httpMethod' in event || 'requestContext' in event;
}
