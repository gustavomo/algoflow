import { assign, createMachine } from 'xstate';
import type {
  SystemChallengeDefinition,
  SystemChallengeEffect,
  SystemChallengeFailure,
  SystemChallengeLoadProfile,
  SystemChallengeRunResult,
} from '@algoflow/contracts';

export interface DesignChallengeContext {
  prediction?: SystemChallengeEffect;
  loadProfile: SystemChallengeLoadProfile;
  failure: SystemChallengeFailure;
  result?: SystemChallengeRunResult;
  error: string;
}

export type DesignChallengeEvent =
  | { type: 'PREDICT'; prediction: SystemChallengeEffect }
  | { type: 'LOAD'; loadProfile: SystemChallengeLoadProfile }
  | { type: 'FAILURE'; failure: SystemChallengeFailure }
  | { type: 'RUN' }
  | { type: 'RESOLVE'; result: SystemChallengeRunResult }
  | { type: 'REJECT'; error: string }
  | { type: 'REFLECT' }
  | { type: 'INSPECT' }
  | { type: 'RESET' };

export function createDesignChallengeMachine(
  definition: SystemChallengeDefinition,
) {
  const initialContext: DesignChallengeContext = {
    loadProfile: definition.loadProfiles[0],
    failure: definition.failures[0],
    error: '',
  };
  return createMachine<DesignChallengeContext, DesignChallengeEvent>(
    {
      predictableActionArguments: true,
      id: 'design-challenge',
      initial: 'predicting',
      context: initialContext,
      states: {
        predicting: {
          on: {
            PREDICT: { actions: 'predict', target: 'configuring' },
            RESET: { actions: 'reset' },
          },
        },
        configuring: {
          on: {
            PREDICT: { actions: 'predict' },
            LOAD: { actions: 'load' },
            FAILURE: { actions: 'failure' },
            RUN: { cond: 'ready', actions: 'clearError', target: 'running' },
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
        running: {
          on: {
            RESOLVE: { actions: 'resolve', target: 'inspecting' },
            REJECT: { actions: 'reject', target: 'configuring' },
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
        inspecting: {
          on: {
            REFLECT: 'reflecting',
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
        reflecting: {
          on: {
            INSPECT: 'inspecting',
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
      },
    },
    {
      actions: {
        predict: assign((_, event) =>
          event.type === 'PREDICT'
            ? { prediction: event.prediction, result: undefined, error: '' }
            : {},
        ),
        load: assign((_, event) =>
          event.type === 'LOAD'
            ? { loadProfile: event.loadProfile, result: undefined, error: '' }
            : {},
        ),
        failure: assign((_, event) =>
          event.type === 'FAILURE'
            ? { failure: event.failure, result: undefined, error: '' }
            : {},
        ),
        resolve: assign((_, event) =>
          event.type === 'RESOLVE' ? { result: event.result, error: '' } : {},
        ),
        reject: assign((_, event) =>
          event.type === 'REJECT' ? { error: event.error } : {},
        ),
        clearError: assign({ error: '' }),
        reset: assign({
          ...initialContext,
          prediction: undefined,
          result: undefined,
        }),
      },
      guards: { ready: (context) => Boolean(context.prediction) },
    },
  );
}
