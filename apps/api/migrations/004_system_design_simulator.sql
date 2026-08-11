CREATE TABLE IF NOT EXISTS simulation_drafts (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  scenario_slug text NOT NULL,
  name text NOT NULL,
  graph jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, scenario_slug)
);

CREATE TABLE IF NOT EXISTS simulation_attempts (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
  scenario_slug text NOT NULL,
  scenario_version integer NOT NULL,
  graph jsonb NOT NULL,
  trade_offs text NOT NULL,
  evaluation jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS simulation_attempts_profile_scenario_idx
  ON simulation_attempts (profile_id, scenario_slug, created_at DESC);
