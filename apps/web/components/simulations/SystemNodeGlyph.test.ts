import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SYSTEM_NODE_TYPES } from '@algoflow/contracts';

const source = readFileSync(
  new URL('./SystemNodeGlyph.tsx', import.meta.url),
  'utf8',
);

describe('SystemNodeGlyph source contract', () => {
  it('keeps every supported infrastructure type on a dedicated render branch', () => {
    for (const type of SYSTEM_NODE_TYPES)
      expect(source).toContain(`case '${type}':`);
  });

  it('uses recognizably different SVG primitives across infrastructure families', () => {
    expect(source).toContain('<circle r="28"');
    expect(source).toMatch(/<ellipse\s+cx="0"\s+cy="-20"/);
    expect(source).toContain('M-22 31v-61');
    expect(source).toContain('C-23-28-10 4');
    expect(source).toContain('C13-23 24-23');
  });

  it('preserves static accessibility and reduced-motion lifecycle meaning', () => {
    expect(source).toContain('role="button"');
    expect(source).toContain('tabIndex={0}');
    expect(source).toContain('aria-label=');
    expect(source).toContain('<title>');
    expect(source).toContain("phase === 'failure'");
    expect(source).toContain("phase === 'recovery'");
    expect(source).toContain("phase === 'terminal'");
    expect(source).toContain('reducedMotion');
  });

  it('uses corner brackets instead of a universal selection box', () => {
    expect(source).toContain(
      'M-53-24V-47H-30M30-47H53V-24M53 24V47H30M-30 47H-53V24',
    );
    expect(source).not.toContain('rx="22"');
  });
});
