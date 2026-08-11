import BfsGridLesson from '../content/lessons/bfs-grid-go.mdx';
import BubbleSortLesson from '../content/lessons/bubble-sort-js.mdx';
import ComplexityBasicsLesson from '../content/lessons/complexity-basics-js.mdx';
import DfsGridLesson from '../content/lessons/dfs-grid-go.mdx';
import SlidingWindowLesson from '../content/lessons/sliding-window-ts.mdx';
import TwoPointersLesson from '../content/lessons/two-pointers-js.mdx';
import ActiveTechnicalReadingLesson from '../content/lessons/active-technical-reading.mdx';
import ContainersAndImagesLesson from '../content/lessons/containers-and-images.mdx';
import JavaScriptExecutionModelLesson from '../content/lessons/javascript-execution-model.mdx';
import PromptToAgentLoopLesson from '../content/lessons/prompt-to-agent-loop.mdx';
import RelationalDataModelingLesson from '../content/lessons/relational-data-modeling.mdx';
import RequestToCdnLesson from '../content/lessons/request-to-cdn.mdx';
import SoftwareSystemsMapLesson from '../content/lessons/software-systems-map.mdx';
import VectorsForMachineLearningLesson from '../content/lessons/vectors-for-machine-learning.mdx';

export const lessonContentBySlug: Record<string, typeof BubbleSortLesson> = {
  'bfs-grid-go': BfsGridLesson,
  'bubble-sort-js': BubbleSortLesson,
  'complexity-basics-js': ComplexityBasicsLesson,
  'dfs-grid-go': DfsGridLesson,
  'sliding-window-ts': SlidingWindowLesson,
  'two-pointers-js': TwoPointersLesson,
  'active-technical-reading': ActiveTechnicalReadingLesson,
  'containers-and-images': ContainersAndImagesLesson,
  'javascript-execution-model': JavaScriptExecutionModelLesson,
  'prompt-to-agent-loop': PromptToAgentLoopLesson,
  'relational-data-modeling': RelationalDataModelingLesson,
  'request-to-cdn': RequestToCdnLesson,
  'software-systems-map': SoftwareSystemsMapLesson,
  'vectors-for-machine-learning': VectorsForMachineLearningLesson,
};
