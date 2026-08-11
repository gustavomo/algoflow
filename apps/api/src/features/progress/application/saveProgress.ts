import type { LessonProgress, LessonStatus } from '@algoflow/contracts';
import { lessonBySlug } from '../../catalog/domain/catalog';
import type { ProgressRepository } from '../ports/progressRepository';

export interface SaveProgressInput {
  lessonSlug: string;
  status: LessonStatus;
  percent: number;
  now?: Date;
}

export async function saveProgress(
  repository: ProgressRepository,
  input: SaveProgressInput,
): Promise<LessonProgress | undefined> {
  if (!lessonBySlug.has(input.lessonSlug)) return undefined;
  const now = (input.now ?? new Date()).toISOString();
  return repository.saveLessonProgress({
    lessonSlug: input.lessonSlug,
    status: input.status,
    percent: Math.min(100, Math.max(0, Math.round(input.percent))),
    startedAt: input.status === 'not-started' ? undefined : now,
    completedAt: input.status === 'completed' ? now : undefined,
    updatedAt: now,
  });
}
