import type { NextApiRequest, NextApiResponse } from 'next';
import {
  SYSTEM_CHALLENGE_EFFECTS,
  SYSTEM_CHALLENGE_FAILURES,
  SYSTEM_CHALLENGE_LOAD_PROFILES,
  type SystemChallengeEffect,
  type SystemChallengeFailure,
  type SystemChallengeLoadProfile,
  type SystemDesignGraph,
} from '@algoflow/contracts';
import { runSimulationChallenge } from '@api/features/simulations/application/simulationUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';

function requireEnum<T extends string>(
  value: unknown,
  field: string,
  options: readonly T[],
) {
  const normalized = requireString(value, field, 80);
  if (!options.includes(normalized as T))
    throw new ApiError(400, 'invalid_request', `${field} is not supported.`);
  return normalized as T;
}

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const result = runSimulationChallenge({
    scenarioSlug: requireString(req.body?.scenarioSlug, 'scenarioSlug', 100),
    challengeId: requireString(req.body?.challengeId, 'challengeId', 100),
    graph: req.body?.graph as SystemDesignGraph,
    phaseId:
      typeof req.body?.phaseId === 'string'
        ? req.body.phaseId.slice(0, 80)
        : undefined,
    prediction: requireEnum<SystemChallengeEffect>(
      req.body?.prediction,
      'prediction',
      SYSTEM_CHALLENGE_EFFECTS,
    ),
    loadProfile: requireEnum<SystemChallengeLoadProfile>(
      req.body?.loadProfile,
      'loadProfile',
      SYSTEM_CHALLENGE_LOAD_PROFILES,
    ),
    failure: requireEnum<SystemChallengeFailure>(
      req.body?.failure,
      'failure',
      SYSTEM_CHALLENGE_FAILURES,
    ),
  });
  if ('missing' in result)
    throw new ApiError(
      404,
      'challenge_not_found',
      result.error ?? 'Challenge not found.',
    );
  if (!result.value)
    throw new ApiError(
      400,
      'invalid_challenge_run',
      result.error ?? 'Challenge run is invalid.',
    );
  res.status(200).json({ result: result.value });
});
