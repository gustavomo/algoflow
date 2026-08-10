import { learningPaths } from '../content/catalog';
import type { LessonProgress, ReviewState } from './types';

export type LearningRecommendation =
  | { kind: 'review'; href: '/review'; title: string; detail: string }
  | { kind: 'lesson'; href: string; title: string; detail: string };

export function recommendNextActivity(
  progress: LessonProgress[],
  reviews: ReviewState[],
  now = new Date(),
): LearningRecommendation {
  const due = reviews
    .filter((review) => new Date(review.dueAt).getTime() <= now.getTime())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  if (due.length > 0) {
    return {
      kind: 'review',
      href: '/review',
      title: `Review ${due[0].conceptId.replaceAll('-', ' ')}`,
      detail: `${due.length} concept${due.length === 1 ? '' : 's'} due now`,
    };
  }

  const completed = new Set(
    progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  const inProgress = progress.find((item) => item.status === 'in-progress');
  if (inProgress) {
    return {
      kind: 'lesson',
      href: `/lessons/${inProgress.lessonSlug}`,
      title: 'Continue your lesson',
      detail: `${inProgress.percent}% complete`,
    };
  }

  const foundation = learningPaths.find(
    (path) => path.slug === 'algorithm-foundations',
  )!;
  const nextLesson = foundation.lessonSlugs.find(
    (lessonSlug) => !completed.has(lessonSlug),
  );
  return {
    kind: 'lesson',
    href: `/lessons/${nextLesson ?? foundation.lessonSlugs[0]}`,
    title:
      completed.size === 0
        ? 'Start Algorithm Foundations'
        : 'Continue Algorithm Foundations',
    detail:
      completed.size === 0
        ? 'Your first guided learning path'
        : 'Your next unlocked lesson',
  };
}
