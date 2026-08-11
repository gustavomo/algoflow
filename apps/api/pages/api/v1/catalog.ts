import type { NextApiRequest, NextApiResponse } from 'next';
import { getCatalog } from '@api/features/catalog/application/getCatalog';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod } from '@api/platform/http/validate';

export default privateApi((req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'GET');
  res.status(200).json(getCatalog());
});
