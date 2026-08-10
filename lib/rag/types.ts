export interface Chunk {
  id: string;
  tech: string;
  topic: string;
  step: number;
  content: string;
}

export interface RetrievalOptions {
  tech?: string;
  topK?: number;
}

export interface RetrievedChunk extends Chunk {
  score: number;
}

export interface Retriever {
  retrieve(query: string, options?: RetrievalOptions): RetrievedChunk[];
  resolve(citationIds: string[]): Chunk[];
}
