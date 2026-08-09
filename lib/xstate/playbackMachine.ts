import { createMachine } from 'xstate';

const playbackMachine = createMachine({
  id: 'playback',
  initial: 'idle',
  states: {
    idle: {
      on: { PLAY: 'playing' },
    },
    playing: {
      on: {
        PAUSE: 'paused',
        NEXT: { actions: 'next' },
        PREV: { actions: 'prev' },
        SPEED: { actions: 'speed' },
      },
    },
    paused: {
      on: { PLAY: 'playing', PREV: { actions: 'prev' }, NEXT: { actions: 'next' } },
    },
  },
});

export default playbackMachine;
