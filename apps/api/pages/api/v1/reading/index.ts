import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createReadingBook,
  getReadingBook,
  listReading,
  updateReadingBook,
} from '@api/features/reading/application/readingUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireString } from '@api/platform/http/validate';
import { getReadingRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getReadingRepository();
  if (req.method === 'GET') {
    const bookId =
      typeof req.query.bookId === 'string' ? req.query.bookId : undefined;
    if (!bookId) {
      res.status(200).json({ books: await listReading(repository) });
      return;
    }
    const detail = await getReadingBook(repository, bookId);
    if (!detail) throw new ApiError(404, 'book_not_found', 'Book not found.');
    res.status(200).json(detail);
    return;
  }
  if (req.method === 'POST') {
    const result = await createReadingBook(repository, req.body ?? {});
    if (!result.value)
      throw new ApiError(
        400,
        'invalid_book',
        result.error ?? 'Book is invalid.',
      );
    res.status(200).json({ book: result.value });
    return;
  }
  if (req.method === 'PATCH') {
    const bookId = requireString(req.body?.bookId, 'bookId', 80);
    const result = await updateReadingBook(repository, bookId, req.body ?? {});
    if ('missing' in result)
      throw new ApiError(404, 'book_not_found', 'Book not found.');
    if (!result.value)
      throw new ApiError(
        400,
        'invalid_book',
        result.error ?? 'Book is invalid.',
      );
    res.status(200).json({ book: result.value });
    return;
  }
  if (req.method === 'DELETE') {
    const bookId = requireString(req.body?.bookId, 'bookId', 80);
    if (!(await repository.deleteBook(bookId)))
      throw new ApiError(404, 'book_not_found', 'Book not found.');
    res.status(200).json({ deleted: true });
    return;
  }
  throw new ApiError(
    405,
    'method_not_allowed',
    'Use GET, POST, PATCH, or DELETE.',
  );
});
