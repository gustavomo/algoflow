import { describe, it, expect } from 'vitest';
import { LocalJsonRetriever, normalizeTerms, retrieve } from '../retrieve';

describe('retrieve', () => {
  it('returns relevant chunks', () => {
    const res = retrieve('swap', 'js');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].id).toBe('js/bubble-sort#1');
  });

  it('matches hyphenated topics from natural-language queries', () => {
    const result = retrieve('bubble sort', 'js', 2);
    expect(result.map((chunk) => chunk.id)).toEqual([
      'js/bubble-sort#1',
      'js/bubble-sort#2',
    ]);
  });

  it('normalizes aliases, filters technology, and clamps topK', () => {
    expect(normalizeTerms('Swapping ARRAYS!')).toEqual(['swap', 'array']);
    const result = new LocalJsonRetriever().retrieve('frontier queue visited', {
      tech: 'go',
      topK: 99,
    });
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.every((chunk) => chunk.tech === 'go')).toBe(true);
  });

  it('resolves only canonical local citation IDs', () => {
    const result = new LocalJsonRetriever().resolve([
      'ts/sliding-window#2',
      'unknown',
    ]);
    expect(result.map((chunk) => chunk.id)).toEqual(['ts/sliding-window#2']);
  });
});
