import type { APIGatewayProxyResult } from 'aws-lambda';
import { ValidationError } from './validation.js';

export function handleError(err: unknown): APIGatewayProxyResult {
  if (err instanceof ValidationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request', message: err.message, statusCode: 400 }),
    };
  }
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred', statusCode: 500 }),
  };
}
