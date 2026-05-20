import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const CLIENT_DIR = join(__dirname, 'client');

export async function handler(event: { path?: string; rawPath?: string }) {
  const reqPath = event.rawPath ?? event.path ?? '/';
  const filePath = reqPath === '/' ? '/index.html' : reqPath;
  const fullPath = join(CLIENT_DIR, filePath);

  if (!existsSync(fullPath)) {
    const fallback = join(CLIENT_DIR, 'index.html');
    return respond(readFileSync(fallback, 'utf-8'), 'text/html');
  }

  const ext = extname(fullPath);
  const mime = MIME[ext] ?? 'application/octet-stream';
  const body = readFileSync(fullPath, ext === '.png' || ext === '.ico' ? undefined : 'utf-8');

  if (typeof body !== 'string') {
    return { statusCode: 200, headers: { 'content-type': mime }, body: body.toString('base64'), isBase64Encoded: true };
  }
  return respond(body, mime);
}

function respond(body: string, contentType: string) {
  const isHtml = contentType === 'text/html';
  return {
    statusCode: 200,
    headers: {
      'content-type': contentType,
      'cache-control': isHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    },
    body,
  };
}
