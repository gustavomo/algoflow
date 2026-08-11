import type { TutorOverlay } from '@algoflow/contracts';
import type { TutorClient } from '../../ports/tutorClient';

export const mockTutorClient: TutorClient = {
  provider: 'mock',
  async tutor({ helpLevel, context }) {
    let overlay: TutorOverlay | undefined;
    if (context.kind === 'bubble-sort') {
      const itemIds = context.selectedItemIds.length
        ? context.selectedItemIds
        : context.items.slice(0, 2).map((item) => item.id);
      overlay = {
        kind: 'highlight-items',
        itemIds,
        label: 'Compare only this adjacent decision.',
      };
    } else {
      const nodeIds =
        context.challengeResult?.affectedNodeIds.slice(0, 4) ??
        (context.selectedNodeId
          ? [context.selectedNodeId]
          : context.graph.nodes.slice(0, 2).map((node) => node.id));
      const edgeIds =
        context.challengeResult?.affectedEdgeIds.slice(0, 3) ??
        (context.selectedEdgeId ? [context.selectedEdgeId] : []);
      overlay = {
        kind: 'highlight-system',
        nodeIds,
        edgeIds,
        label: 'Trace the condition through these visible boundaries.',
      };
    }
    const subject =
      context.kind === 'bubble-sort'
        ? 'the two adjacent values'
        : 'the highlighted control boundary';
    if (helpLevel === 'nudge')
      return {
        message: `Look at ${subject}. Name what it knows before deciding what should happen next.`,
        followUpQuestion: 'What invariant must still be true after this step?',
        overlay,
      };
    if (helpLevel === 'guided-question')
      return {
        message: `Trace input, state change, and output through ${subject}. Which visible component owns the decision, and which one only observes it?`,
        followUpQuestion:
          'What would change if that owning control disappeared?',
        overlay,
      };
    return {
      message:
        context.kind === 'bubble-sort'
          ? 'Bubble Sort compares one adjacent pair. It swaps only when the left value is greater, which moves the larger value toward the settled boundary.'
          : 'The model follows the injected condition through the components that exist in your graph. A recovery result requires an explicit reversible control; missing controls turn uncertainty into cutover or availability risk.',
      followUpQuestion: 'Can you restate the rule using the current scene?',
      overlay,
    };
  },
};
