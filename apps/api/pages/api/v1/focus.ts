import type { NextApiRequest, NextApiResponse } from 'next';
import { pathBySlug } from '@api/features/catalog/domain/catalog';
import { focusPath } from '@api/features/progress/application/focusPath';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { getLearningRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getLearningRepository();
  if (req.method === 'GET') {
    res
      .status(200)
      .json({ focusedPathSlug: await repository.getFocusedPath() });
    return;
  }
  if (req.method === 'DELETE') {
    res.status(200).json(await focusPath(repository));
    return;
  }
  if (req.method !== 'POST') {
    throw new ApiError(405, 'method_not_allowed', 'Use GET, POST, or DELETE.');
  }
  const pathSlug =
    typeof req.body?.pathSlug === 'string' ? req.body.pathSlug.trim() : '';
  if (!pathSlug || !pathBySlug.has(pathSlug)) {
    throw new ApiError(
      400,
      'invalid_path',
      'Select an available learning path.',
    );
  }
  res.status(200).json(await focusPath(repository, pathSlug));
});
