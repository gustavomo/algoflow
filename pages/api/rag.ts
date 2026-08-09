import type { NextApiRequest, NextApiResponse } from 'next';
import { retrieve } from '../../lib/rag/retrieve';
import { withTimer } from '../../lib/analytics/otel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q = '', tech } = req.method === 'POST' ? req.body : req.query;
  const chunks = await withTimer('rag', async () => retrieve(String(q), tech ? String(tech) : undefined));
  res.status(200).json({ chunks });
}
