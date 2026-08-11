import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

describe('architecture boundaries', () => {
  const apiRoot = path.resolve(import.meta.dirname, '..');
  const repositoryRoot = path.resolve(apiRoot, '../../..');

  it('keeps feature domain and application code independent of adapters', () => {
    const protectedFiles = sourceFiles(path.join(apiRoot, 'features')).filter(
      (file) =>
        !file.includes('/__tests__/') &&
        !file.endsWith('.test.ts') &&
        (file.includes('/domain/') || file.includes('/application/')),
    );
    const violations = protectedFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /from ['"](?:next|pg|openai|web-push|.*\/adapters\/|.*\/platform\/)/.test(
        source,
      )
        ? [path.relative(repositoryRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });

  it('keeps the web independent of API internals and providers', () => {
    const webFiles = sourceFiles(path.join(repositoryRoot, 'apps/web'));
    const violations = webFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /from ['"](?:@api\/|pg['"]|openai['"]|web-push['"]|.*apps\/api)/.test(
        source,
      )
        ? [path.relative(repositoryRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });
});
