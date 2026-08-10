import type {
  AssessmentDefinition,
  LearningPathDefinition,
  LessonDefinition,
  TopicDefinition,
} from './types';

export const topics: TopicDefinition[] = [
  {
    slug: 'complexity',
    title: 'Complexity',
    description:
      'Reason about how running time and memory grow with input size.',
    accent: 'violet',
  },
  {
    slug: 'sorting',
    title: 'Sorting',
    description:
      'Understand ordering algorithms through comparisons, movement, and invariants.',
    accent: 'amber',
  },
  {
    slug: 'array-patterns',
    title: 'Array Patterns',
    description:
      'Reuse pointer and window patterns instead of starting every problem from scratch.',
    accent: 'cyan',
  },
  {
    slug: 'graphs',
    title: 'Graphs',
    description:
      'Explore connected structures with breadth-first and depth-first traversal.',
    accent: 'emerald',
  },
];

export const lessons: LessonDefinition[] = [
  {
    slug: 'complexity-basics-js',
    title: 'Complexity Basics',
    summary:
      'Build an intuition for O(1), O(n), and O(n²) before comparing algorithms.',
    tech: 'js',
    topicSlug: 'complexity',
    conceptIds: ['growth-rates', 'big-o'],
    estimatedMinutes: 12,
    visualization: 'complexity',
    assessmentSlug: 'complexity-basics-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'bubble-sort-js',
    title: 'Bubble Sort',
    summary:
      'Trace adjacent comparisons and see the sorted boundary grow after every pass.',
    tech: 'js',
    topicSlug: 'sorting',
    conceptIds: ['adjacent-comparison', 'sorting-invariant'],
    estimatedMinutes: 18,
    visualization: 'bubble-sort',
    assessmentSlug: 'bubble-sort-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'two-pointers-js',
    title: 'Two Pointers',
    summary:
      'Coordinate two indices to replace nested scans with a single structured pass.',
    tech: 'js',
    topicSlug: 'array-patterns',
    conceptIds: ['pointer-invariant', 'linear-scan'],
    estimatedMinutes: 16,
    visualization: 'two-pointers',
    assessmentSlug: 'two-pointers-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'sliding-window-ts',
    title: 'Sliding Window',
    summary:
      'Maintain a useful subarray while moving its boundaries in linear time.',
    tech: 'ts',
    topicSlug: 'array-patterns',
    conceptIds: ['window-invariant', 'incremental-state'],
    estimatedMinutes: 20,
    visualization: 'sliding-window',
    assessmentSlug: 'sliding-window-checkpoint',
    prerequisites: ['two-pointers-js'],
  },
  {
    slug: 'bfs-grid-go',
    title: 'BFS Grid',
    summary:
      'Use a queue to explore a grid layer by layer and find shortest unweighted paths.',
    tech: 'go',
    topicSlug: 'graphs',
    conceptIds: ['queue-frontier', 'visited-set'],
    estimatedMinutes: 22,
    visualization: 'bfs-grid',
    assessmentSlug: 'bfs-grid-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'dfs-grid-go',
    title: 'DFS Grid',
    summary:
      'Follow one branch deeply, backtrack, and compare the traversal with BFS.',
    tech: 'go',
    topicSlug: 'graphs',
    conceptIds: ['stack-frontier', 'visited-set'],
    estimatedMinutes: 20,
    visualization: 'dfs-grid',
    assessmentSlug: 'dfs-grid-checkpoint',
    prerequisites: ['bfs-grid-go'],
  },
];

export const learningPaths: LearningPathDefinition[] = [
  {
    slug: 'algorithm-foundations',
    title: 'Algorithm Foundations',
    description:
      'Start with growth, then connect sorting, array patterns, and traversal.',
    lessonSlugs: [
      'complexity-basics-js',
      'bubble-sort-js',
      'two-pointers-js',
      'bfs-grid-go',
    ],
    estimatedMinutes: 68,
  },
  {
    slug: 'array-patterns',
    title: 'Array Patterns',
    description:
      'Practice the two index-based patterns that unlock many interview problems.',
    lessonSlugs: [
      'complexity-basics-js',
      'two-pointers-js',
      'sliding-window-ts',
    ],
    estimatedMinutes: 48,
  },
  {
    slug: 'graph-traversal',
    title: 'Graph Traversal',
    description:
      'Compare queue and stack frontiers on the same grid mental model.',
    lessonSlugs: ['complexity-basics-js', 'bfs-grid-go', 'dfs-grid-go'],
    estimatedMinutes: 54,
  },
];

export const assessments: AssessmentDefinition[] = [
  {
    slug: 'complexity-basics-checkpoint',
    lessonSlug: 'complexity-basics-js',
    title: 'Complexity Basics Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'complexity-growth',
        kind: 'multiple-choice',
        prompt: 'Which growth rate becomes expensive fastest as n grows?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 'O(n²)',
        explanation: 'Quadratic work grows with the square of the input size.',
        conceptIds: ['growth-rates'],
      },
      {
        id: 'complexity-linear',
        kind: 'text',
        prompt: 'Write the Big-O for scanning every array item once.',
        correctAnswer: 'O(n)',
        explanation: 'One bounded operation per item produces linear growth.',
        conceptIds: ['big-o'],
      },
    ],
  },
  {
    slug: 'bubble-sort-checkpoint',
    lessonSlug: 'bubble-sort-js',
    title: 'Bubble Sort Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'bubble-action',
        kind: 'multiple-choice',
        prompt:
          'What does Bubble Sort do when the left adjacent value is larger?',
        options: [
          'Stops',
          'Swaps the pair',
          'Skips the pair',
          'Reverses the array',
        ],
        correctAnswer: 'Swaps the pair',
        explanation: 'The adjacent inversion is removed with a swap.',
        conceptIds: ['adjacent-comparison'],
      },
      {
        id: 'bubble-order',
        kind: 'ordering',
        prompt: 'Order the phases for an out-of-order pair.',
        options: ['Compare', 'Swap', 'Settle'],
        correctAnswer: ['Compare', 'Swap', 'Settle'],
        explanation:
          'The player first evaluates, then moves, then presents the stable result.',
        conceptIds: ['sorting-invariant'],
      },
    ],
  },
  {
    slug: 'two-pointers-checkpoint',
    lessonSlug: 'two-pointers-js',
    title: 'Two Pointers Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'pointer-benefit',
        kind: 'multiple-choice',
        prompt: 'Why can two pointers replace some nested loops?',
        options: [
          'They preserve a movement invariant',
          'They sort automatically',
          'They use recursion',
          'They cache the array',
        ],
        correctAnswer: 'They preserve a movement invariant',
        explanation:
          'A valid invariant tells each pointer when and how to move.',
        conceptIds: ['pointer-invariant'],
      },
    ],
  },
  {
    slug: 'sliding-window-checkpoint',
    lessonSlug: 'sliding-window-ts',
    title: 'Sliding Window Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'window-state',
        kind: 'multiple-choice',
        prompt: 'What makes a sliding window efficient?',
        options: [
          'It recomputes every subarray',
          'It updates state as boundaries move',
          'It sorts first',
          'It uses a queue',
        ],
        correctAnswer: 'It updates state as boundaries move',
        explanation:
          'Incremental updates avoid recomputing each range from scratch.',
        conceptIds: ['incremental-state'],
      },
    ],
  },
  {
    slug: 'bfs-grid-checkpoint',
    lessonSlug: 'bfs-grid-go',
    title: 'BFS Grid Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'bfs-frontier',
        kind: 'multiple-choice',
        prompt: 'Which data structure gives BFS its layer-by-layer order?',
        options: ['Stack', 'Queue', 'Heap', 'Hash map'],
        correctAnswer: 'Queue',
        explanation: 'FIFO processing expands the oldest frontier layer first.',
        conceptIds: ['queue-frontier'],
      },
    ],
  },
  {
    slug: 'dfs-grid-checkpoint',
    lessonSlug: 'dfs-grid-go',
    title: 'DFS Grid Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'dfs-frontier',
        kind: 'multiple-choice',
        prompt:
          'Which frontier discipline makes DFS explore one branch deeply?',
        options: ['FIFO queue', 'LIFO stack', 'Priority queue', 'Sorted set'],
        correctAnswer: 'LIFO stack',
        explanation: 'The newest discovered node is processed first.',
        conceptIds: ['stack-frontier'],
      },
    ],
  },
];

export const lessonBySlug = new Map(
  lessons.map((lesson) => [lesson.slug, lesson]),
);
export const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
export const pathBySlug = new Map(
  learningPaths.map((path) => [path.slug, path]),
);
export const assessmentBySlug = new Map(
  assessments.map((assessment) => [assessment.slug, assessment]),
);

export function validateCatalog() {
  const errors: string[] = [];
  for (const lesson of lessons) {
    if (!topicBySlug.has(lesson.topicSlug))
      errors.push(`${lesson.slug}: unknown topic ${lesson.topicSlug}`);
    if (!assessmentBySlug.has(lesson.assessmentSlug))
      errors.push(
        `${lesson.slug}: unknown assessment ${lesson.assessmentSlug}`,
      );
    for (const prerequisite of lesson.prerequisites) {
      if (!lessonBySlug.has(prerequisite))
        errors.push(`${lesson.slug}: unknown prerequisite ${prerequisite}`);
    }
  }
  for (const path of learningPaths) {
    for (const lessonSlug of path.lessonSlugs) {
      if (!lessonBySlug.has(lessonSlug))
        errors.push(`${path.slug}: unknown lesson ${lessonSlug}`);
    }
  }
  for (const assessment of assessments) {
    if (!lessonBySlug.has(assessment.lessonSlug))
      errors.push(
        `${assessment.slug}: unknown lesson ${assessment.lessonSlug}`,
      );
  }
  return errors;
}
