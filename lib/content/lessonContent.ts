import BfsGridLesson from '../../content/lessons/bfs-grid-go.mdx';
import BubbleSortLesson from '../../content/lessons/bubble-sort-js.mdx';
import ComplexityBasicsLesson from '../../content/lessons/complexity-basics-js.mdx';
import DfsGridLesson from '../../content/lessons/dfs-grid-go.mdx';
import SlidingWindowLesson from '../../content/lessons/sliding-window-ts.mdx';
import TwoPointersLesson from '../../content/lessons/two-pointers-js.mdx';

export const lessonContentBySlug: Record<string, typeof BubbleSortLesson> = {
  'bfs-grid-go': BfsGridLesson,
  'bubble-sort-js': BubbleSortLesson,
  'complexity-basics-js': ComplexityBasicsLesson,
  'dfs-grid-go': DfsGridLesson,
  'sliding-window-ts': SlidingWindowLesson,
  'two-pointers-js': TwoPointersLesson,
};
