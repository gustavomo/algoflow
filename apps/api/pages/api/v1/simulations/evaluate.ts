import type { NextApiRequest, NextApiResponse } from 'next';
import type { SystemDesignGraph } from '@algoflow/contracts';
import { evaluateSimulation } from '@api/features/simulations/application/simulationUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';
import {
  getLearningRepository,
  getSimulationRepository,
} from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const result = await evaluateSimulation(
    getSimulationRepository(),
    getLearningRepository(),
    {
      scenarioSlug: requireString(req.body?.scenarioSlug, 'scenarioSlug', 100),
      graph: req.body?.graph as SystemDesignGraph,
      tradeOffs: requireString(req.body?.tradeOffs, 'tradeOffs', 4_000),
    },
  );
  if ('missing' in result)
    throw new ApiError(404, 'scenario_not_found', 'Scenario not found.');
  if (!result.value)
    throw new ApiError(
      400,
      'invalid_design',
      result.error ?? 'Design is invalid.',
    );
  res.status(200).json({ attempt: result.value });
});
