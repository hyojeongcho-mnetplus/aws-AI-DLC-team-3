import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createLogger } from '@ffr/shared';
import { handleGetIssues, handleGetIssueDetail } from './routes/issues.js';
import { handleCreateActionBrief } from './routes/actions.js';
import { handleGetHealth } from './routes/health.js';
import { withSecurityHeaders } from './middleware/security-headers.js';
import { handleError } from './middleware/error-handler.js';

const logger = createLogger('api');

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters } = event;
  logger.info('Request received', { httpMethod, path });

  try {
    let response: APIGatewayProxyResult;

    if (httpMethod === 'GET' && path === '/api/issues') {
      response = await handleGetIssues(event);
    } else if (httpMethod === 'GET' && path.startsWith('/api/issues/') && pathParameters?.clusterId) {
      response = await handleGetIssueDetail(pathParameters.clusterId);
    } else if (httpMethod === 'POST' && path.startsWith('/api/actions/') && pathParameters?.clusterId) {
      response = await handleCreateActionBrief(pathParameters.clusterId);
    } else if (httpMethod === 'GET' && path === '/api/health') {
      response = await handleGetHealth();
    } else {
      response = { statusCode: 404, body: JSON.stringify({ error: 'Not Found', message: 'Route not found', statusCode: 404 }) };
    }

    return withSecurityHeaders(response);
  } catch (err) {
    logger.error('Unhandled error', { error: String(err) });
    return withSecurityHeaders(handleError(err));
  }
}
