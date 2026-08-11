import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  ScenarioDraftDifficulty,
  ScenarioDraftGenerationRequest,
} from '@algoflow/contracts';
import { getScenarioAuthoringProvider } from '@api/features/authoring/adapters/scenarioAuthoringProvider';
import { generateScenarioDraft } from '@api/features/authoring/application/scenarioAuthoring';
import { isScenarioAuthoringEnabled } from '@api/features/authoring/domain/scenarioDraft';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  if (!isScenarioAuthoringEnabled())
    throw new ApiError(
      404,
      'authoring_disabled',
      'Scenario authoring is disabled.',
    );
  const kind = requireString(req.body?.kind, 'kind', 40);
  const difficulty = requireString(req.body?.difficulty, 'difficulty', 40);
  if (!['bubble-sort', 'design-lab'].includes(kind))
    throw new ApiError(400, 'invalid_request', 'kind is not supported.');
  if (!['foundation', 'intermediate', 'advanced'].includes(difficulty))
    throw new ApiError(400, 'invalid_request', 'difficulty is not supported.');
  const request: ScenarioDraftGenerationRequest = {
    kind: kind as ScenarioDraftGenerationRequest['kind'],
    objective: requireString(req.body?.objective, 'objective', 240),
    difficulty: difficulty as ScenarioDraftDifficulty,
  };
  try {
    const provider = await getScenarioAuthoringProvider();
    const result = await generateScenarioDraft(provider, request);
    if (!result.value)
      throw new ApiError(
        502,
        'invalid_generated_draft',
        result.error ?? 'The provider returned an invalid draft.',
        true,
      );
    res.status(200).json(result.value);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'authoring_provider_error',
      'The authoring provider is temporarily unavailable.',
      true,
    );
  }
});
