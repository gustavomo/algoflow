import type { CurriculumDomain, RagChunk, Tech } from '@algoflow/contracts';

export interface RetrievalOptions {
  tech?: Tech;
  domain?: CurriculumDomain;
  topK?: number;
}

export interface RetrievedChunk extends RagChunk {
  score: number;
}

export interface Retriever {
  retrieve(query: string, options?: RetrievalOptions): RetrievedChunk[];
  resolve(citationIds: string[]): RagChunk[];
}
