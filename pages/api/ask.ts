import type { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from '../../lib/ai/aiClient';
import { memo } from '../../lib/cache/memo';
import { withTimer } from '../../lib/analytics/otel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { question, tech, citations } = req.body as { question: string; tech?: string; citations?: string[] };
  const client = await getClient();
  const key = JSON.stringify({ question, tech, citations });
  const answer = await withTimer('ask', () => memo(key, () => client.ask(question, tech, citations)));
  res.status(200).json({ answer });
}
