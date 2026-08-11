import type { NextApiRequest, NextApiResponse } from 'next';
import type { SystemDesignGraph } from '@algoflow/contracts';
import { proposeSimulationDesign } from '@api/features/simulations/application/simulationUseCases';
import { getDesignProposalProvider } from '@api/features/simulations/adapters/designProposalProviders';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  try {
    const result = await proposeSimulationDesign(getDesignProposalProvider(), {
      scenarioSlug: requireString(req.body?.scenarioSlug, 'scenarioSlug', 100),
      graph: req.body?.graph as SystemDesignGraph,
      question:
        typeof req.body?.question === 'string'
          ? req.body.question.slice(0, 800)
          : undefined,
      phaseId:
        typeof req.body?.phaseId === 'string'
          ? req.body.phaseId.slice(0, 80)
          : undefined,
    });
    if ('missing' in result)
      throw new ApiError(404, 'scenario_not_found', 'Scenario not found.');
    if (!result.value)
      throw new ApiError(
        400,
        'invalid_proposal',
        result.error ?? 'Proposal is invalid.',
      );
    res.status(200).json({ proposal: result.value });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'proposal_provider_error',
      'The design proposal provider is temporarily unavailable.',
      true,
    );
  }
});
