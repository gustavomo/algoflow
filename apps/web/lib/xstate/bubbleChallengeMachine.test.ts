import { interpret } from 'xstate';
import { createBubbleSortChallenge } from '@algoflow/learning-engine';
import { describe, expect, it } from 'vitest';
import { createBubbleChallengeMachine } from './bubbleChallengeMachine';

const challenge = createBubbleSortChallenge({
  id: 'bubble-machine-test',
  version: 1,
  title: 'Bubble machine test',
  objective: 'Exercise every deterministic decision.',
  values: [3, 1, 2],
});

describe('Bubble Sort challenge machine', () => {
  it('gives feedback for an incorrect prediction and supports retry', () => {
    const service = interpret(createBubbleChallengeMachine(challenge)).start();
    const decision = challenge.decisions[0];
    service.send({ type: 'SELECT_PAIR', itemIds: decision.pairItemIds });
    service.send({ type: 'PREDICT_SWAP', value: !decision.shouldSwap });
    service.send({ type: 'RUN' });
    expect(service.state.matches('feedback')).toBe(true);
    expect(service.state.context.predictionCorrect).toBe(false);
    service.send({ type: 'RETRY' });
    expect(service.state.matches('predicting')).toBe(true);
    expect(service.state.context.selectedItemIds).toEqual([]);
  });

  it('reaches completion through the derived decisions and resets cleanly', () => {
    const service = interpret(createBubbleChallengeMachine(challenge)).start();
    for (const decision of challenge.decisions) {
      service.send({ type: 'SELECT_PAIR', itemIds: decision.pairItemIds });
      service.send({ type: 'PREDICT_SWAP', value: decision.shouldSwap });
      service.send({ type: 'RUN' });
      expect(service.state.context.predictionCorrect).toBe(true);
      service.send({ type: 'CONTINUE' });
    }
    expect(service.state.matches('complete')).toBe(true);
    service.send({ type: 'RESET' });
    expect(service.state.matches('predicting')).toBe(true);
    expect(service.state.context.decisionIndex).toBe(0);
  });

  it('ignores item IDs that do not exist in the current snapshot', () => {
    const service = interpret(createBubbleChallengeMachine(challenge)).start();
    service.send({ type: 'SELECT_ITEM', itemId: 'missing' });
    expect(service.state.context.selectedItemIds).toEqual([]);
  });
});
