CREATE TABLE IF NOT EXISTS learner_profiles (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO learner_profiles (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS lesson_progress (
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  lesson_slug text NOT NULL,
  status text NOT NULL CHECK (status IN ('not-started', 'in-progress', 'completed')),
  percent integer NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, lesson_slug)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  assessment_slug text NOT NULL,
  lesson_slug text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  correct_count integer NOT NULL,
  total_count integer NOT NULL,
  answers jsonb NOT NULL,
  failed_concept_ids text[] NOT NULL DEFAULT '{}',
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_attempts_profile_created_idx
  ON assessment_attempts (profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS concept_mastery (
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  concept_id text NOT NULL,
  score double precision NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 1),
  evidence_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, concept_id)
);

CREATE TABLE IF NOT EXISTS review_state (
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  concept_id text NOT NULL,
  lesson_slug text NOT NULL,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor double precision NOT NULL DEFAULT 2.5,
  repetitions integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL,
  last_reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, concept_id)
);

CREATE INDEX IF NOT EXISTS review_state_profile_due_idx
  ON review_state (profile_id, due_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
  profile_id text PRIMARY KEY REFERENCES learner_profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'America/Bogota',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO notification_preferences (profile_id)
VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  expiration_time double precision,
  p256dh text NOT NULL,
  auth text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id bigserial PRIMARY KEY,
  endpoint text NOT NULL,
  dedupe_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endpoint, dedupe_key)
);
