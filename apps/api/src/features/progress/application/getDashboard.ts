import type { ProgressRepository } from '../ports/progressRepository';
import { recommendNextActivity } from './recommendation';

export async function getDashboard(repository: ProgressRepository) {
  const snapshot = await repository.getSnapshot();
  return {
    snapshot,
    recommendation: recommendNextActivity(
      snapshot.progress,
      snapshot.reviews,
      new Date(),
      snapshot.focusedPathSlug,
    ),
  };
}
