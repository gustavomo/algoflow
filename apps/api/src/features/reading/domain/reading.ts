import type {
  ReadingBook,
  ReadingNote,
  ReadingStatus,
} from '@algoflow/contracts';

const STATUSES: ReadingStatus[] = ['planned', 'reading', 'paused', 'completed'];

function text(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : undefined;
}

function integer(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
}

export function buildBook(
  input: Record<string, unknown>,
  existing?: ReadingBook,
  now = new Date(),
): { value?: ReadingBook; error?: string } {
  const title = text(input.title ?? existing?.title, 180);
  const author = text(input.author ?? existing?.author, 140);
  const editionValue = input.edition ?? existing?.edition;
  const edition = editionValue ? text(editionValue, 80) : undefined;
  const totalChapters = integer(input.totalChapters ?? existing?.totalChapters);
  const currentChapter = integer(
    input.currentChapter ?? existing?.currentChapter ?? 0,
  );
  const status = (input.status ??
    existing?.status ??
    'planned') as ReadingStatus;
  if (!title || !author || (editionValue && !edition)) {
    return {
      error: 'Title, author, and edition must use the documented limits.',
    };
  }
  if (
    totalChapters == null ||
    totalChapters < 1 ||
    totalChapters > 10_000 ||
    currentChapter == null ||
    currentChapter < 0 ||
    currentChapter > totalChapters
  ) {
    return { error: 'Chapter progress must be within the book chapter range.' };
  }
  if (!STATUSES.includes(status))
    return { error: 'Reading status is invalid.' };
  const effectiveChapter =
    status === 'completed' ? totalChapters : currentChapter;
  const timestamp = now.toISOString();
  return {
    value: {
      id: existing?.id ?? crypto.randomUUID(),
      title,
      author,
      edition,
      totalChapters,
      currentChapter: effectiveChapter,
      status,
      startedAt:
        existing?.startedAt ??
        (status !== 'planned' || effectiveChapter > 0 ? timestamp : undefined),
      completedAt:
        status === 'completed' ? existing?.completedAt ?? timestamp : undefined,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
  };
}

export function buildNote(
  input: Record<string, unknown>,
  book: ReadingBook,
  now = new Date(),
): { value?: ReadingNote; error?: string } {
  const body = text(input.body, 2_000);
  const chapterValue = input.chapter;
  const chapter =
    chapterValue == null || chapterValue === ''
      ? undefined
      : integer(chapterValue);
  if (!body)
    return { error: 'Write a synthesis note of at most 2,000 characters.' };
  if (chapter != null && (chapter < 1 || chapter > book.totalChapters)) {
    return { error: 'The note chapter must exist in this book.' };
  }
  const timestamp = now.toISOString();
  return {
    value: {
      id: crypto.randomUUID(),
      bookId: book.id,
      chapter,
      body,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

export function reviewPrompt(input: Record<string, unknown>) {
  const prompt = text(input.prompt, 500);
  const answer = text(input.answer, 2_000);
  if (!prompt || !answer) return undefined;
  return { prompt, answer };
}
