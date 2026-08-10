import { interpret } from 'xstate';
import { describe, it, expect } from 'vitest';
import playbackMachine from '../playbackMachine';

describe('playbackMachine', () => {
  it('controls play, pause, seek, speed, and completion boundaries', () => {
    const service = interpret(playbackMachine).start();
    service.send({ type: 'SETUP', totalSteps: 4 });
    expect(service.state.matches('idle')).toBe(true);
    service.send('PLAY');
    expect(service.state.matches('playing')).toBe(true);
    service.send('PAUSE');
    expect(service.state.matches('paused')).toBe(true);
    service.send({ type: 'SEEK', index: 2 });
    expect(service.state.context.stepIndex).toBe(2);
    service.send({ type: 'SPEED', speedMs: 400 });
    expect(service.state.context.speedMs).toBe(400);
    service.send('NEXT');
    expect(service.state.matches('completed')).toBe(true);
    expect(service.state.context.stepIndex).toBe(3);
  });
});
