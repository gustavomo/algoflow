import type { NextApiRequest, NextApiResponse } from 'next';
import type { SystemDesignGraph } from '@algoflow/contracts';
import { saveSimulationDraft } from '@api/features/simulations/application/simulationUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';
import { getSimulationRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const result = await saveSimulationDraft(getSimulationRepository(), {
    scenarioSlug: requireString(req.body?.scenarioSlug, 'scenarioSlug', 100),
    name: requireString(req.body?.name, 'name', 100),
    graph: req.body?.graph as SystemDesignGraph,
  });
  if ('missing' in result)
    throw new ApiError(404, 'scenario_not_found', 'Scenario not found.');
  if (!result.value)
    throw new ApiError(
      400,
      'invalid_graph',
      result.error ?? 'Draft is invalid.',
    );
  res.status(200).json({ draft: result.value });
});
