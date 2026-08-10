import { assign, createMachine } from 'xstate';

export interface PlaybackContext {
  stepIndex: number;
  totalSteps: number;
  speedMs: number;
}

export type PlaybackEvent =
  | { type: 'SETUP'; totalSteps: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SEEK'; index: number }
  | { type: 'SPEED'; speedMs: number }
  | { type: 'RESET' };

const playbackMachine = createMachine<PlaybackContext, PlaybackEvent>(
  {
    predictableActionArguments: true,
    id: 'playback',
    initial: 'idle',
    context: { stepIndex: 0, totalSteps: 1, speedMs: 700 },
    on: {
      SETUP: { target: 'idle', actions: 'setup' },
      RESET: { target: 'idle', actions: 'reset' },
    },
    states: {
      idle: {
        on: {
          PLAY: [
            { cond: 'atEnd', actions: 'reset', target: 'playing' },
            { target: 'playing' },
          ],
          NEXT: [
            { cond: 'nextCompletes', actions: 'next', target: 'completed' },
            { actions: 'next' },
          ],
          PREV: { actions: 'prev' },
          SEEK: [
            { cond: 'seekCompletes', actions: 'seek', target: 'completed' },
            { actions: 'seek' },
          ],
          SPEED: { actions: 'speed' },
        },
      },
      playing: {
        after: {
          AUTO_STEP: [
            { cond: 'nextCompletes', actions: 'next', target: 'completed' },
            { actions: 'next', target: 'playing' },
          ],
        },
        on: {
          PAUSE: 'paused',
          NEXT: [
            { cond: 'nextCompletes', actions: 'next', target: 'completed' },
            { actions: 'next' },
          ],
          PREV: { actions: 'prev', target: 'paused' },
          SEEK: [
            { cond: 'seekCompletes', actions: 'seek', target: 'completed' },
            { actions: 'seek', target: 'paused' },
          ],
          SPEED: { actions: 'speed', target: 'playing' },
        },
      },
      paused: {
        on: {
          PLAY: [
            { cond: 'atEnd', actions: 'reset', target: 'playing' },
            { target: 'playing' },
          ],
          PREV: { actions: 'prev' },
          NEXT: [
            { cond: 'nextCompletes', actions: 'next', target: 'completed' },
            { actions: 'next' },
          ],
          SEEK: [
            { cond: 'seekCompletes', actions: 'seek', target: 'completed' },
            { actions: 'seek' },
          ],
          SPEED: { actions: 'speed' },
        },
      },
      completed: {
        on: {
          PLAY: { actions: 'reset', target: 'playing' },
          PREV: { actions: 'prev', target: 'paused' },
          SEEK: [
            { cond: 'seekCompletes', actions: 'seek' },
            { actions: 'seek', target: 'paused' },
          ],
          SPEED: { actions: 'speed' },
        },
      },
    },
  },
  {
    actions: {
      setup: assign((_, event) =>
        event.type === 'SETUP'
          ? { stepIndex: 0, totalSteps: Math.max(1, event.totalSteps) }
          : {},
      ),
      reset: assign({ stepIndex: 0 }),
      next: assign({
        stepIndex: (context) =>
          Math.min(context.totalSteps - 1, context.stepIndex + 1),
      }),
      prev: assign({
        stepIndex: (context) => Math.max(0, context.stepIndex - 1),
      }),
      seek: assign((context, event) =>
        event.type === 'SEEK'
          ? {
              stepIndex: Math.min(
                context.totalSteps - 1,
                Math.max(0, event.index),
              ),
            }
          : {},
      ),
      speed: assign((_, event) =>
        event.type === 'SPEED'
          ? { speedMs: Math.min(2_000, Math.max(150, event.speedMs)) }
          : {},
      ),
    },
    guards: {
      atEnd: (context) => context.stepIndex >= context.totalSteps - 1,
      nextCompletes: (context) => context.stepIndex >= context.totalSteps - 2,
      seekCompletes: (context, event) =>
        event.type === 'SEEK' && event.index >= context.totalSteps - 1,
    },
    delays: { AUTO_STEP: (context) => context.speedMs },
  },
);

export default playbackMachine;
