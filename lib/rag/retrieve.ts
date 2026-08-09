import fs from 'fs';
import path from 'path';
import { Chunk } from './types';

const chunks: Chunk[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'lib/rag/chunks.json'), 'utf8')
);

function score(text: string, query: string) {
  const tokens = query.toLowerCase().split(/\s+/);
  let s = 0;
  for (const t of tokens) {
    if (text.toLowerCase().includes(t)) s += 1;
  }
  return s;
}

export function retrieve(q: string, tech?: string, topK = 5): Chunk[] {
  const scored = chunks
    .filter((c) => !tech || c.tech === tech)
    .map((c) => ({ c, s: score(c.content, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map(({ c }) => c);
  return scored;
}
