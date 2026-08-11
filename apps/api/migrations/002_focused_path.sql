ALTER TABLE learner_profiles
  ADD COLUMN IF NOT EXISTS focused_path_slug text;
