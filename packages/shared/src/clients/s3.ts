import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.S3_BUCKET_NAME ?? 'fan-friction-radar-raw';

export async function uploadRaw(source: string, date: string, data: unknown[]): Promise<string> {
  const key = `raw/${source}/${date}/${Date.now()}.json`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
  return key;
}
