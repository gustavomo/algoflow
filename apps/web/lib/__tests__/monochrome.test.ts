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

const WEB_ROOT = path.resolve(import.meta.dirname, '../..');

const readGlobals = () =>
  fs.readFileSync(path.join(WEB_ROOT, 'app/globals.css'), 'utf8');

/** Body of the rule whose selector ends with `[data-theme='<name>']`. */
function themeBlock(css: string, name: 'dark' | 'light'): string {
  const match = new RegExp(
    `:root\\[data-theme='${name}'\\]\\s*\\{([^}]*)\\}`,
  ).exec(css);
  if (!match) throw new Error(`No ${name} theme block in globals.css`);
  return match[1];
}

function tokensOf(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function themeTokens() {
  const css = readGlobals();
  return {
    dark: tokensOf(themeBlock(css, 'dark')),
    light: tokensOf(themeBlock(css, 'light')),
  };
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

  it('defines every theme token in both the dark and the light theme', () => {
    const tokens = themeTokens();
    const dark = Object.keys(tokens.dark).sort();
    const light = Object.keys(tokens.light).sort();
    expect(dark.length).toBeGreaterThan(20);
    expect(light).toEqual(dark);
    for (const theme of [tokens.dark, tokens.light]) {
      for (const [name, value] of Object.entries(theme)) {
        if (name.startsWith('--color-')) {
          expect(value, name).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
        }
      }
    }
  });

  it('declares the colour scheme of each theme', () => {
    const css = readGlobals();
    expect(themeBlock(css, 'dark')).toContain('color-scheme: dark;');
    expect(themeBlock(css, 'light')).toContain('color-scheme: light;');
  });

  it('keeps the browser chrome colours in sync with the canvas tokens', () => {
    const tokens = themeTokens();
    const theme = fs.readFileSync(path.join(WEB_ROOT, 'lib/theme.ts'), 'utf8');
    for (const [name, constant] of [
      ['dark', 'DARK_CANVAS_HEX'],
      ['light', 'LIGHT_CANVAS_HEX'],
    ] as const) {
      const hex = `#${tokens[name]['--color-canvas']
        .split(' ')
        .map((value) => Number(value).toString(16).padStart(2, '0'))
        .join('')}`;
      expect(theme).toContain(`${constant} = '${hex}'`);
    }
  });
});
