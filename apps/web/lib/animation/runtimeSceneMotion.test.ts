import { describe, expect, it } from 'vitest';
import { tokenExitVariant } from './runtimeSceneMotion';

describe('tokenExitVariant', () => {
  it('does not throw when framer-motion passes no custom value', () => {
    const exit = tokenExitVariant('timeout-cb', false);
    expect(() => exit(undefined)).not.toThrow();
    expect(() => exit(null)).not.toThrow();
    expect(exit(undefined)).toMatchObject({ opacity: 0, scale: 0.6 });
  });

  it('hides moved tokens instantly and shrinks popped ones', () => {
    const exit = tokenExitVariant('timeout-cb', false);
    expect(exit(new Set(['timeout-cb']))).toEqual({
      opacity: 0,
      transition: { duration: 0 },
    });
    expect(exit(new Set(['other']))).toMatchObject({ scale: 0.6 });
  });

  it('never animates exits under reduced motion', () => {
    expect(tokenExitVariant('a', true)(new Set())).toEqual({
      opacity: 0,
      transition: { duration: 0 },
    });
  });
});
