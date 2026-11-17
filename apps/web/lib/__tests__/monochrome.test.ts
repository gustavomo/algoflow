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

  it('reads colours from theme tokens instead of hard-coding them', () => {
    const webRoot = path.resolve(import.meta.dirname, '../..');
    const files = [
      ...sourceFiles(path.join(webRoot, 'app')),
      ...sourceFiles(path.join(webRoot, 'components')),
    ].filter(
      // globals.css is where the tokens themselves are defined.
      (file) => !/\.test\.tsx?$|globals\.css$/.test(file),
    );
    const violations = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /#[0-9a-f]{6}\b|rgba?\(\s*\d|\b(?:bg|text|border|fill|stroke)-(?:white|black)\b/i.test(
        source,
      )
        ? [path.relative(webRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });

  it('keeps the browser chrome colour in sync with the canvas token', () => {
    const webRoot = path.resolve(import.meta.dirname, '../..');
    const css = fs.readFileSync(path.join(webRoot, 'app/globals.css'), 'utf8');
    const theme = fs.readFileSync(path.join(webRoot, 'lib/theme.ts'), 'utf8');
    const channels = /--color-canvas:\s*(\d+) (\d+) (\d+)/.exec(css)!;
    const hex = `#${channels
      .slice(1)
      .map((value) => Number(value).toString(16).padStart(2, '0'))
      .join('')}`;
    expect(theme).toContain(`'${hex}'`);
  });
});
