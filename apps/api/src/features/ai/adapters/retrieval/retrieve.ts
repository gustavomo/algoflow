import chunksData from './chunks.json';
import type { CurriculumDomain, Tech } from '@algoflow/contracts';
import type {
  Chunk,
  RetrievedChunk,
  Retriever,
  RetrievalOptions,
} from './types';

const chunks = chunksData as Chunk[];
const aliases: Record<string, string> = {
  swapping: 'swap',
  swapped: 'swap',
  compares: 'compare',
  comparison: 'compare',
  arrays: 'array',
  pointers: 'pointer',
  windows: 'window',
  queues: 'queue',
  stacks: 'stack',
  visited: 'visit',
  visiting: 'visit',
  complexity: 'big',
  quadratic: 'n2',
};
const stopWords = new Set([
  'a',
  'an',
  'and',
  'for',
  'how',
  'is',
  'of',
  'the',
  'to',
  'what',
  'why',
]);

export function normalizeTerms(value: string) {
  return value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((term) => term && !stopWords.has(term))
    .map((term) => aliases[term] ?? term);
}

function chunkTerms(chunk: Chunk) {
  return normalizeTerms(
    `${chunk.tech ?? ''} ${chunk.domain} ${chunk.topic} ${chunk.content}`,
  );
}

const documentFrequency = new Map<string, number>();
for (const chunk of chunks) {
  for (const term of new Set(chunkTerms(chunk))) {
    documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
}

function scoreChunk(chunk: Chunk, queryTerms: string[]) {
  const terms = chunkTerms(chunk);
  const frequencies = new Map<string, number>();
  for (const term of terms)
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  return queryTerms.reduce((score, term) => {
    const frequency = frequencies.get(term) ?? 0;
    if (!frequency) return score;
    const inverseDocumentFrequency =
      Math.log((chunks.length + 1) / ((documentFrequency.get(term) ?? 0) + 1)) +
      1;
    const topicBonus = chunk.topic.includes(term) ? 1.35 : 1;
    return (
      score + (1 + Math.log(frequency)) * inverseDocumentFrequency * topicBonus
    );
  }, 0);
}

export class LocalJsonRetriever implements Retriever {
  retrieve(query: string, options: RetrievalOptions = {}): RetrievedChunk[] {
    const queryTerms = Array.from(new Set(normalizeTerms(query)));
    if (queryTerms.length === 0) return [];
    const topK = Math.min(10, Math.max(1, options.topK ?? 5));
    return chunks
      .filter((chunk) => !options.tech || chunk.tech === options.tech)
      .filter((chunk) => !options.domain || chunk.domain === options.domain)
      .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, queryTerms) }))
      .filter((chunk) => chunk.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.id.localeCompare(right.id),
      )
      .slice(0, topK);
  }

  resolve(citationIds: string[]) {
    const ids = new Set(citationIds);
    return chunks.filter((chunk) => ids.has(chunk.id));
  }
}

export const localJsonRetriever = new LocalJsonRetriever();

export function retrieve(
  query: string,
  tech?: Tech,
  topK = 5,
  domain?: CurriculumDomain,
): Chunk[] {
  return localJsonRetriever
    .retrieve(query, { tech, domain, topK })
    .map(({ score: _score, ...chunk }) => chunk);
}

// Future adapter: implement Retriever with pgvector while preserving these contracts.
