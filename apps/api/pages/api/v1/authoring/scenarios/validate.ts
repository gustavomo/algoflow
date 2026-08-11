import type { NextApiRequest, NextApiResponse } from 'next';
import { validateScenarioDraft } from '@api/features/authoring/application/scenarioAuthoring';
import { isScenarioAuthoringEnabled } from '@api/features/authoring/domain/scenarioDraft';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod } from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  if (!isScenarioAuthoringEnabled())
    throw new ApiError(
      404,
      'authoring_disabled',
      'Scenario authoring is disabled.',
    );
  const result = validateScenarioDraft(req.body?.draft);
  if (!result.value)
    throw new ApiError(
      400,
      'invalid_scenario_draft',
      result.error ?? 'Scenario draft is invalid.',
    );
  res.status(200).json(result.value);
});
