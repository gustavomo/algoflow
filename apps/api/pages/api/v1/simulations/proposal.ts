import type { NextApiRequest, NextApiResponse } from 'next';
import type { SystemDesignGraph } from '@algoflow/contracts';
import { proposeSimulationDesign } from '@api/features/simulations/application/simulationUseCases';
import { getDesignProposalProvider } from '@api/features/simulations/adapters/designProposalProviders';
import { ApiError } from '@api/platform/http/errors';
import { aiProviderApiError } from '@api/platform/http/aiProviderErrors';
import { privateApi } from '@api/platform/http/handlers';
import { requestAbort } from '@api/platform/http/requestAbort';
import {
  optionalAIProviderSelection,
  requireMethod,
  requireString,
} from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const abort = requestAbort(req, res);
  try {
    const provider = await getDesignProposalProvider(
      optionalAIProviderSelection(req.body),
    );
    const result = await proposeSimulationDesign(provider, {
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
      signal: abort.signal,
    });
    if ('missing' in result)
      throw new ApiError(404, 'scenario_not_found', 'Scenario not found.');
    if (!result.value)
      throw new ApiError(
        400,
        'invalid_proposal',
        result.error ?? 'Proposal is invalid.',
      );
    abort.cleanup();
    res.status(200).json({ proposal: result.value });
  } catch (error) {
    abort.cleanup();
    if (error instanceof ApiError) throw error;
    const providerError = aiProviderApiError(error);
    if (providerError) throw providerError;
    throw new ApiError(
      502,
      'proposal_provider_error',
      'The design proposal provider is temporarily unavailable.',
      true,
    );
  }
});
