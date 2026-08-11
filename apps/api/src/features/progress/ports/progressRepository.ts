import type { LearningSnapshot, LessonProgress } from '@algoflow/contracts';

export interface ProgressRepository {
  getSnapshot(): Promise<LearningSnapshot>;
  saveLessonProgress(progress: LessonProgress): Promise<LessonProgress>;
  getFocusedPath(): Promise<string | undefined>;
  setFocusedPath(pathSlug?: string): Promise<string | undefined>;
}
