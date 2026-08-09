import { describe, it, expect } from 'vitest';
import { retrieve } from '../retrieve';

describe('retrieve', () => {
  it('returns relevant chunks', () => {
    const res = retrieve('swap', 'js');
    expect(res.length).toBeGreaterThan(0);
  });
});
