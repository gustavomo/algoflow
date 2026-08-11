import type { NextApiRequest, NextApiResponse } from 'next';
import { createAIProviderRegistry } from '@api/platform/ai/providerRegistry';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod } from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'GET');
  const registry = await createAIProviderRegistry();
  res.status(200).json(registry.catalog);
});
