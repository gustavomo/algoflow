import type { NextApiRequest, NextApiResponse } from 'next';
import { getDashboard } from '@api/features/progress/application/getDashboard';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod } from '@api/platform/http/validate';
import { getLearningRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'GET');
  res.status(200).json(await getDashboard(getLearningRepository()));
});
