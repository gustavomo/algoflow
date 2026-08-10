export type Tech = 'js' | 'ts' | 'go';

export type VisualizationKind =
  | 'complexity'
  | 'bubble-sort'
  | 'two-pointers'
  | 'sliding-window'
  | 'bfs-grid'
  | 'dfs-grid';

export interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
  accent: 'amber' | 'cyan' | 'violet' | 'emerald';
}

export interface LessonDefinition {
  slug: string;
  title: string;
  summary: string;
  tech: Tech;
  topicSlug: string;
  conceptIds: string[];
  estimatedMinutes: number;
  visualization: VisualizationKind;
  assessmentSlug: string;
  prerequisites: string[];
}

export interface LearningPathDefinition {
  slug: string;
  title: string;
  description: string;
  lessonSlugs: string[];
  estimatedMinutes: number;
}

export type AssessmentQuestion =
  | {
      id: string;
      kind: 'multiple-choice' | 'text';
      prompt: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
      conceptIds: string[];
    }
  | {
      id: string;
      kind: 'ordering';
      prompt: string;
      options: string[];
      correctAnswer: string[];
      explanation: string;
      conceptIds: string[];
    };

export interface AssessmentDefinition {
  slug: string;
  lessonSlug: string;
  title: string;
  passingScore: number;
  questions: AssessmentQuestion[];
}
