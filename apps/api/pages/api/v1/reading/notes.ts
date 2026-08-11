import type { NextApiRequest, NextApiResponse } from 'next';
import { createReadingNote } from '@api/features/reading/application/readingUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireString } from '@api/platform/http/validate';
import { getReadingRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getReadingRepository();
  if (req.method === 'POST') {
    const bookId = requireString(req.body?.bookId, 'bookId', 80);
    const result = await createReadingNote(repository, bookId, req.body ?? {});
    if ('missing' in result)
      throw new ApiError(404, 'book_not_found', 'Book not found.');
    if (!result.value)
      throw new ApiError(
        400,
        'invalid_note',
        result.error ?? 'Note is invalid.',
      );
    res.status(200).json({ note: result.value });
    return;
  }
  if (req.method === 'DELETE') {
    const noteId = requireString(req.body?.noteId, 'noteId', 80);
    if (!(await repository.deleteNote(noteId)))
      throw new ApiError(404, 'note_not_found', 'Note not found.');
    res.status(200).json({ deleted: true });
    return;
  }
  throw new ApiError(405, 'method_not_allowed', 'Use POST or DELETE.');
});
