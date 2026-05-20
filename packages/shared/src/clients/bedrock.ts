import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION ?? 'us-east-1' });
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-4-sonnet-20260514-v1:0';

export async function invokeModel(prompt: string): Promise<string> {
  const res = await bedrock.send(new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  }));
  const body = JSON.parse(new TextDecoder().decode(res.body));
  return body.content[0].text;
}
