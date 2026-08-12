import type { PoolClient } from 'pg';
import { getPool } from '../db/client';
import type {
  AssessmentAttempt,
  LearningSnapshot,
  LessonProgress,
  NotificationPreferences,
  PushSubscriptionRecord,
  ReviewState,
} from '@algoflow/contracts';
import type { LearningRepository, RecordedAssessment } from './types';

const PROFILE_ID = 'default';

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function mapProgress(row: any): LessonProgress {
  return {
    lessonSlug: row.lesson_slug,
    status: row.status,
    percent: row.percent,
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
    updatedAt: iso(row.updated_at)!,
  };
}

function mapAttempt(row: any): AssessmentAttempt {
  return {
    id: row.id,
    assessmentSlug: row.assessment_slug,
    lessonSlug: row.lesson_slug,
    score: row.score,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    answers: row.answers,
    failedConceptIds: row.failed_concept_ids,
    durationSeconds: row.duration_seconds,
    createdAt: iso(row.created_at)!,
  };
}

function mapReview(row: any): ReviewState {
  return {
    conceptId: row.concept_id,
    lessonSlug: row.lesson_slug ?? undefined,
    sourceType: row.source_type ?? 'lesson',
    sourceId: row.source_id ?? undefined,
    title: row.title ?? undefined,
    prompt: row.prompt ?? undefined,
    answer: row.answer ?? undefined,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: iso(row.due_at)!,
    lastReviewedAt: iso(row.last_reviewed_at),
  };
}

async function ensureProfile(client: PoolClient) {
  await client.query(
    'INSERT INTO learner_profiles (id) VALUES ($1) ON CONFLICT DO NOTHING',
    [PROFILE_ID],
  );
  await client.query(
    `INSERT INTO notification_preferences (profile_id, timezone)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [PROFILE_ID, process.env.REMINDER_TIMEZONE || 'America/Bogota'],
  );
}

export class PostgresLearningRepository implements LearningRepository {
  async getSnapshot(): Promise<LearningSnapshot> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await ensureProfile(client);
      const progress = await client.query(
        'SELECT * FROM lesson_progress WHERE profile_id = $1 ORDER BY updated_at DESC',
        [PROFILE_ID],
      );
      const attempts = await client.query(
        'SELECT * FROM assessment_attempts WHERE profile_id = $1 ORDER BY created_at DESC',
        [PROFILE_ID],
      );
      const reviews = await client.query(
        'SELECT * FROM review_state WHERE profile_id = $1 ORDER BY due_at',
        [PROFILE_ID],
      );
      const preferences = await client.query(
        'SELECT * FROM notification_preferences WHERE profile_id = $1',
        [PROFILE_ID],
      );
      const profile = await client.query(
        'SELECT focused_path_slug FROM learner_profiles WHERE id = $1',
        [PROFILE_ID],
      );
      const preference = preferences.rows[0];
      return {
        progress: progress.rows.map(mapProgress),
        attempts: attempts.rows.map(mapAttempt),
        reviews: reviews.rows.map(mapReview),
        notificationPreferences: {
          enabled: preference.enabled,
          timezone: preference.timezone,
          updatedAt: iso(preference.updated_at)!,
        },
        focusedPathSlug: profile.rows[0]?.focused_path_slug ?? undefined,
      };
    } finally {
      client.release();
    }
  }

  async getFocusedPath() {
    const result = await getPool().query(
      'SELECT focused_path_slug FROM learner_profiles WHERE id = $1',
      [PROFILE_ID],
    );
    return result.rows[0]?.focused_path_slug ?? undefined;
  }

  async setFocusedPath(pathSlug?: string) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await ensureProfile(client);
      const result = await client.query(
        'UPDATE learner_profiles SET focused_path_slug = $2 WHERE id = $1 RETURNING focused_path_slug',
        [PROFILE_ID, pathSlug ?? null],
      );
      return result.rows[0]?.focused_path_slug ?? undefined;
    } finally {
      client.release();
    }
  }

  async saveLessonProgress(progress: LessonProgress) {
    const result = await getPool().query(
      `INSERT INTO lesson_progress
        (profile_id, lesson_slug, status, percent, started_at, completed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (profile_id, lesson_slug) DO UPDATE SET
         status = EXCLUDED.status,
         percent = EXCLUDED.percent,
         started_at = COALESCE(lesson_progress.started_at, EXCLUDED.started_at),
         completed_at = EXCLUDED.completed_at,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        PROFILE_ID,
        progress.lessonSlug,
        progress.status,
        progress.percent,
        progress.startedAt ?? null,
        progress.completedAt ?? null,
        progress.updatedAt,
      ],
    );
    return mapProgress(result.rows[0]);
  }

  async recordAssessment(input: RecordedAssessment) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureProfile(client);
      const attempt = input.attempt;
      const inserted = await client.query(
        `INSERT INTO assessment_attempts
          (id, profile_id, assessment_slug, lesson_slug, score, correct_count, total_count,
           answers, failed_concept_ids, duration_seconds, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          attempt.id,
          PROFILE_ID,
          attempt.assessmentSlug,
          attempt.lessonSlug,
          attempt.score,
          attempt.correctCount,
          attempt.totalCount,
          JSON.stringify(attempt.answers),
          attempt.failedConceptIds,
          attempt.durationSeconds,
          attempt.createdAt,
        ],
      );
      if (input.updatesLessonProgress !== false)
        await client.query(
          `INSERT INTO lesson_progress
          (profile_id, lesson_slug, status, percent, started_at, completed_at, updated_at)
         VALUES ($1, $2, 'completed', 100, $3, $3, $3)
         ON CONFLICT (profile_id, lesson_slug) DO UPDATE SET
           status = 'completed', percent = 100,
           completed_at = EXCLUDED.completed_at, updated_at = EXCLUDED.updated_at`,
          [PROFILE_ID, attempt.lessonSlug, attempt.createdAt],
        );
      for (const evidence of input.evidence) {
        const delta = evidence.correct ? 0.18 : -0.22;
        if (input.updatesMastery !== false)
          await client.query(
            `INSERT INTO concept_mastery (profile_id, concept_id, score, evidence_count)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (profile_id, concept_id) DO UPDATE SET
             score = LEAST(1, GREATEST(0, concept_mastery.score + $4)),
             evidence_count = concept_mastery.evidence_count + 1,
             updated_at = now()`,
            [
              PROFILE_ID,
              evidence.conceptId,
              evidence.correct ? delta : 0,
              delta,
            ],
          );
        const dueDays = evidence.correct ? 3 : 1;
        await client.query(
          `INSERT INTO review_state
            (profile_id, concept_id, lesson_slug, interval_days, due_at, lapses,
             source_type, source_id, title, prompt, answer)
           VALUES ($1, $2, $3, $4, now() + make_interval(days => $4), $5, $6, $7, $8, $9, $10)
           ON CONFLICT (profile_id, concept_id) DO UPDATE SET
             lesson_slug = EXCLUDED.lesson_slug,
             source_type = EXCLUDED.source_type,
             source_id = EXCLUDED.source_id,
             title = EXCLUDED.title,
             prompt = EXCLUDED.prompt,
             answer = EXCLUDED.answer,
             repetitions = CASE WHEN $5 = 1 THEN 0 ELSE review_state.repetitions END,
             lapses = review_state.lapses + $5,
             due_at = CASE WHEN $5 = 1 THEN EXCLUDED.due_at ELSE LEAST(review_state.due_at, EXCLUDED.due_at) END,
             updated_at = now()`,
          [
            PROFILE_ID,
            evidence.conceptId,
            evidence.lessonSlug,
            dueDays,
            evidence.correct ? 0 : 1,
            evidence.sourceType ?? 'lesson',
            evidence.sourceId ?? null,
            evidence.title ?? null,
            evidence.prompt ?? null,
            evidence.answer ?? null,
          ],
        );
      }
      await client.query('COMMIT');
      return mapAttempt(inserted.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getReview(conceptId: string) {
    const result = await getPool().query(
      'SELECT * FROM review_state WHERE profile_id = $1 AND concept_id = $2',
      [PROFILE_ID, conceptId],
    );
    return result.rows[0] ? mapReview(result.rows[0]) : undefined;
  }

  async saveReview(review: ReviewState) {
    const result = await getPool().query(
      `INSERT INTO review_state
        (profile_id, concept_id, lesson_slug, interval_days, ease_factor, repetitions,
         lapses, due_at, last_reviewed_at, source_type, source_id, title, prompt, answer, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
       ON CONFLICT (profile_id, concept_id) DO UPDATE SET
         lesson_slug = EXCLUDED.lesson_slug,
         interval_days = EXCLUDED.interval_days,
         ease_factor = EXCLUDED.ease_factor,
         repetitions = EXCLUDED.repetitions,
         lapses = EXCLUDED.lapses,
         due_at = EXCLUDED.due_at,
         last_reviewed_at = EXCLUDED.last_reviewed_at,
         source_type = EXCLUDED.source_type,
         source_id = EXCLUDED.source_id,
         title = EXCLUDED.title,
         prompt = EXCLUDED.prompt,
         answer = EXCLUDED.answer,
         updated_at = now()
       RETURNING *`,
      [
        PROFILE_ID,
        review.conceptId,
        review.lessonSlug,
        review.intervalDays,
        review.easeFactor,
        review.repetitions,
        review.lapses,
        review.dueAt,
        review.lastReviewedAt ?? null,
        review.sourceType ?? 'lesson',
        review.sourceId ?? null,
        review.title ?? null,
        review.prompt ?? null,
        review.answer ?? null,
      ],
    );
    return mapReview(result.rows[0]);
  }

  async listDueReviews(now: Date) {
    const result = await getPool().query(
      'SELECT * FROM review_state WHERE profile_id = $1 AND due_at <= $2 ORDER BY due_at',
      [PROFILE_ID, now.toISOString()],
    );
    return result.rows.map(mapReview);
  }

  async saveNotificationPreferences(preferences: NotificationPreferences) {
    const result = await getPool().query(
      `INSERT INTO notification_preferences (profile_id, enabled, timezone, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (profile_id) DO UPDATE SET
         enabled = EXCLUDED.enabled, timezone = EXCLUDED.timezone, updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        PROFILE_ID,
        preferences.enabled,
        preferences.timezone,
        preferences.updatedAt,
      ],
    );
    return {
      enabled: result.rows[0].enabled,
      timezone: result.rows[0].timezone,
      updatedAt: iso(result.rows[0].updated_at)!,
    };
  }

  async savePushSubscription(subscription: PushSubscriptionRecord) {
    await getPool().query(
      `INSERT INTO push_subscriptions
        (endpoint, profile_id, expiration_time, p256dh, auth, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, now())
       ON CONFLICT (endpoint) DO UPDATE SET
         expiration_time = EXCLUDED.expiration_time,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         active = true,
         updated_at = now()`,
      [
        subscription.endpoint,
        PROFILE_ID,
        subscription.expirationTime,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ],
    );
  }

  async removePushSubscription(endpoint: string) {
    await getPool().query(
      'DELETE FROM push_subscriptions WHERE profile_id = $1 AND endpoint = $2',
      [PROFILE_ID, endpoint],
    );
  }

  async listActivePushSubscriptions() {
    const result = await getPool().query(
      'SELECT * FROM push_subscriptions WHERE profile_id = $1 AND active = true',
      [PROFILE_ID],
    );
    return result.rows.map((row) => ({
      endpoint: row.endpoint,
      expirationTime: row.expiration_time,
      keys: { p256dh: row.p256dh, auth: row.auth },
    }));
  }

  async claimNotificationDelivery(endpoint: string, dedupeKey: string) {
    const result = await getPool().query(
      `INSERT INTO notification_deliveries (endpoint, dedupe_key)
       VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`,
      [endpoint, dedupeKey],
    );
    return result.rowCount === 1;
  }

  async releaseNotificationDelivery(endpoint: string, dedupeKey: string) {
    await getPool().query(
      'DELETE FROM notification_deliveries WHERE endpoint = $1 AND dedupe_key = $2',
      [endpoint, dedupeKey],
    );
  }

  async deactivatePushSubscription(endpoint: string) {
    await getPool().query(
      'UPDATE push_subscriptions SET active = false, updated_at = now() WHERE endpoint = $1',
      [endpoint],
    );
  }
}
