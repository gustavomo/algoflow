import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getSimulationCatalog,
  getSimulationWorkspace,
} from '@api/features/simulations/application/simulationUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { getSimulationRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET')
    throw new ApiError(405, 'method_not_allowed', 'Use GET.');
  const repository = getSimulationRepository();
  const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
  if (!slug) {
    res.status(200).json({ items: await getSimulationCatalog(repository) });
    return;
  }
  const workspace = await getSimulationWorkspace(repository, slug);
  if (!workspace)
    throw new ApiError(404, 'scenario_not_found', 'Scenario not found.');
  res.status(200).json(workspace);
});
