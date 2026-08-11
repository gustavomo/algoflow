import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [target] : [];
  });
}

describe('monochrome interface source', () => {
  it('does not reintroduce the legacy accent palette or raw page backgrounds', () => {
    const webRoot = path.resolve(import.meta.dirname, '../..');
    const files = [
      ...sourceFiles(path.join(webRoot, 'app')),
      ...sourceFiles(path.join(webRoot, 'components')),
    ];
    const violations = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /\b(?:cyan|amber|violet|emerald|rose|slate)-|bg-\[#[0-9a-f]+\]/i.test(
        source,
      )
        ? [path.relative(webRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });
});
