import { interpret } from 'xstate';
import { describe, it, expect } from 'vitest';
import playbackMachine from '../playbackMachine';

describe('playbackMachine', () => {
  it('transitions play/pause', () => {
    const service = interpret(playbackMachine).start();
    expect(service.state.matches('idle')).toBe(true);
    service.send('PLAY');
    expect(service.state.matches('playing')).toBe(true);
    service.send('PAUSE');
    expect(service.state.matches('paused')).toBe(true);
  });
});
