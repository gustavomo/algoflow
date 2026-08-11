ALTER TABLE review_state
  ALTER COLUMN lesson_slug DROP NOT NULL;

ALTER TABLE review_state
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'lesson',
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS prompt text,
  ADD COLUMN IF NOT EXISTS answer text;

CREATE TABLE IF NOT EXISTS reading_books (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  edition text,
  total_chapters integer NOT NULL CHECK (total_chapters BETWEEN 1 AND 10000),
  current_chapter integer NOT NULL DEFAULT 0 CHECK (current_chapter >= 0),
  status text NOT NULL CHECK (status IN ('planned', 'reading', 'paused', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (current_chapter <= total_chapters)
);

CREATE INDEX IF NOT EXISTS reading_books_profile_updated_idx
  ON reading_books (profile_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS reading_notes (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  book_id text NOT NULL REFERENCES reading_books(id) ON DELETE CASCADE,
  chapter integer CHECK (chapter >= 1),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reading_notes_book_created_idx
  ON reading_notes (profile_id, book_id, created_at);
