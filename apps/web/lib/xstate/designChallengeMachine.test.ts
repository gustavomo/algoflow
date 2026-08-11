import { interpret } from 'xstate';
import type { SystemChallengeDefinition } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { createDesignChallengeMachine } from './designChallengeMachine';

const definition: SystemChallengeDefinition = {
  id: 'test',
  version: 1,
  scenarioSlug: 'test-scenario',
  title: 'Test challenge',
  objective: 'Test the challenge state machine.',
  constraints: ['Keep the test deterministic.'],
  predictionOptions: ['latency-rise', 'queue-pressure'],
  loadProfiles: ['surge'],
  failures: ['load-spike'],
};

describe('design challenge machine', () => {
  it('requires a prediction before running and can reset', () => {
    const service = interpret(createDesignChallengeMachine(definition)).start();
    service.send({ type: 'RUN' });
    expect(service.state.matches('predicting')).toBe(true);
    service.send({ type: 'PREDICT', prediction: 'queue-pressure' });
    service.send({ type: 'RUN' });
    expect(service.state.matches('running')).toBe(true);
    service.send({ type: 'RESET' });
    expect(service.state.matches('predicting')).toBe(true);
    expect(service.state.context.prediction).toBeUndefined();
  });
});
