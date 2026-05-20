import type { APIGatewayProxyResult } from 'aws-lambda';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Type': 'application/json',
};

export function withSecurityHeaders(response: APIGatewayProxyResult): APIGatewayProxyResult {
  return {
    ...response,
    headers: { ...SECURITY_HEADERS, ...response.headers },
  };
}
