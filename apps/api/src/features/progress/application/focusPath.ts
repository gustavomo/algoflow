import { pathBySlug } from '../../catalog/domain/catalog';
import type { ProgressRepository } from '../ports/progressRepository';

export async function focusPath(
  repository: ProgressRepository,
  pathSlug?: string,
) {
  if (pathSlug && !pathBySlug.has(pathSlug)) return undefined;
  const focusedPathSlug = await repository.setFocusedPath(pathSlug);
  return { focusedPathSlug };
}
