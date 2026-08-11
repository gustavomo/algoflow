import { assign, createMachine } from 'xstate';
import type { BubbleSortChallenge } from '@algoflow/learning-engine';
import { evaluateBubbleSortPrediction } from '@algoflow/learning-engine';

export interface BubbleChallengeContext {
  decisionIndex: number;
  selectedItemIds: string[];
  predictedSwap: boolean | null;
  feedback: string;
  predictionCorrect: boolean | null;
}

export type BubbleChallengeEvent =
  | { type: 'SELECT_ITEM'; itemId: string }
  | { type: 'SELECT_PAIR'; itemIds: [string, string] }
  | { type: 'PREDICT_SWAP'; value: boolean }
  | { type: 'RUN' }
  | { type: 'RETRY' }
  | { type: 'CONTINUE' }
  | { type: 'RESET' };

const emptyDecision: Pick<
  BubbleChallengeContext,
  'selectedItemIds' | 'predictedSwap' | 'feedback' | 'predictionCorrect'
> = {
  selectedItemIds: [],
  predictedSwap: null,
  feedback: '',
  predictionCorrect: null,
};

export function createBubbleChallengeMachine(challenge: BubbleSortChallenge) {
  return createMachine<BubbleChallengeContext, BubbleChallengeEvent>(
    {
      predictableActionArguments: true,
      id: 'bubble-challenge',
      initial: 'predicting',
      context: { decisionIndex: 0, ...emptyDecision },
      states: {
        predicting: {
          on: {
            SELECT_ITEM: { actions: 'selectItem' },
            SELECT_PAIR: { actions: 'selectPair' },
            PREDICT_SWAP: { actions: 'predictSwap' },
            RUN: [
              {
                cond: 'readyAndCorrect',
                actions: 'evaluatePrediction',
                target: 'feedback',
              },
              {
                cond: 'ready',
                actions: 'evaluatePrediction',
                target: 'feedback',
              },
            ],
            RESET: { actions: 'reset' },
          },
        },
        feedback: {
          on: {
            RETRY: { actions: 'clearDecision', target: 'predicting' },
            CONTINUE: [
              {
                cond: 'lastCorrectDecision',
                target: 'complete',
              },
              {
                cond: 'correctDecision',
                actions: 'advance',
                target: 'predicting',
              },
            ],
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
        complete: {
          on: {
            RESET: { actions: 'reset', target: 'predicting' },
          },
        },
      },
    },
    {
      actions: {
        selectItem: assign((context, event) => {
          if (event.type !== 'SELECT_ITEM') return {};
          const decision = challenge.decisions[context.decisionIndex];
          if (
            !decision.compareSnapshot.items.some(
              (item) => item.id === event.itemId,
            )
          )
            return {};
          const selected = context.selectedItemIds.includes(event.itemId)
            ? context.selectedItemIds.filter((id) => id !== event.itemId)
            : [...context.selectedItemIds, event.itemId].slice(-2);
          return { selectedItemIds: selected, feedback: '' };
        }),
        selectPair: assign((context, event) => {
          if (event.type !== 'SELECT_PAIR') return {};
          const validIds = new Set(
            challenge.decisions[
              context.decisionIndex
            ].compareSnapshot.items.map((item) => item.id),
          );
          if (!event.itemIds.every((itemId) => validIds.has(itemId))) return {};
          return {
            selectedItemIds: [...event.itemIds],
            predictedSwap: true,
            feedback: '',
          };
        }),
        predictSwap: assign((_, event) =>
          event.type === 'PREDICT_SWAP'
            ? { predictedSwap: event.value, feedback: '' }
            : {},
        ),
        evaluatePrediction: assign((context) => {
          const decision = challenge.decisions[context.decisionIndex];
          const result = evaluateBubbleSortPrediction(
            decision,
            context.selectedItemIds,
            context.predictedSwap ?? false,
          );
          return {
            feedback: result.feedback,
            predictionCorrect: result.correct,
          };
        }),
        clearDecision: assign({ ...emptyDecision }),
        advance: assign((context) => ({
          decisionIndex: Math.min(
            challenge.decisions.length - 1,
            context.decisionIndex + 1,
          ),
          ...emptyDecision,
        })),
        reset: assign({ decisionIndex: 0, ...emptyDecision }),
      },
      guards: {
        ready: (context) =>
          context.selectedItemIds.length === 2 &&
          context.predictedSwap !== null,
        readyAndCorrect: (context) => {
          if (
            context.selectedItemIds.length !== 2 ||
            context.predictedSwap === null
          )
            return false;
          return evaluateBubbleSortPrediction(
            challenge.decisions[context.decisionIndex],
            context.selectedItemIds,
            context.predictedSwap,
          ).correct;
        },
        correctDecision: (context) => context.predictionCorrect === true,
        lastCorrectDecision: (context) =>
          context.predictionCorrect === true &&
          context.decisionIndex >= challenge.decisions.length - 1,
      },
    },
  );
}
