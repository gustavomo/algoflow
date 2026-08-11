import type {
  SystemDesignAttempt,
  SystemDesignDraft,
} from '@algoflow/contracts';
import { getPool } from '../../../platform/db/client';
import type { SimulationRepository } from '../ports/simulationRepository';

const PROFILE_ID = 'default';
const iso = (value: Date | string) => new Date(value).toISOString();

function mapDraft(row: any): SystemDesignDraft {
  return {
    id: row.id,
    scenarioSlug: row.scenario_slug,
    name: row.name,
    graph: row.graph,
    updatedAt: iso(row.updated_at),
  };
}
function mapAttempt(row: any): SystemDesignAttempt {
  return {
    id: row.id,
    scenarioSlug: row.scenario_slug,
    scenarioVersion: row.scenario_version,
    graph: row.graph,
    tradeOffs: row.trade_offs,
    evaluation: row.evaluation,
    createdAt: iso(row.created_at),
  };
}

export class PostgresSimulationRepository implements SimulationRepository {
  async getDraft(scenarioSlug: string) {
    const result = await getPool().query(
      'SELECT * FROM simulation_drafts WHERE profile_id = $1 AND scenario_slug = $2',
      [PROFILE_ID, scenarioSlug],
    );
    return result.rows[0] ? mapDraft(result.rows[0]) : undefined;
  }
  async saveDraft(draft: SystemDesignDraft) {
    const result = await getPool().query(
      `INSERT INTO simulation_drafts (id, profile_id, scenario_slug, name, graph, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (profile_id, scenario_slug) DO UPDATE SET name=EXCLUDED.name, graph=EXCLUDED.graph, updated_at=EXCLUDED.updated_at
       RETURNING *`,
      [
        draft.id,
        PROFILE_ID,
        draft.scenarioSlug,
        draft.name,
        JSON.stringify(draft.graph),
        draft.updatedAt,
      ],
    );
    return mapDraft(result.rows[0]);
  }
  async listAttempts(scenarioSlug?: string) {
    const result = scenarioSlug
      ? await getPool().query(
          'SELECT * FROM simulation_attempts WHERE profile_id = $1 AND scenario_slug = $2 ORDER BY created_at DESC',
          [PROFILE_ID, scenarioSlug],
        )
      : await getPool().query(
          'SELECT * FROM simulation_attempts WHERE profile_id = $1 ORDER BY created_at DESC',
          [PROFILE_ID],
        );
    return result.rows.map(mapAttempt);
  }
  async saveAttempt(attempt: SystemDesignAttempt) {
    const result = await getPool().query(
      `INSERT INTO simulation_attempts (id, profile_id, scenario_slug, scenario_version, graph, trade_offs, evaluation, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        attempt.id,
        PROFILE_ID,
        attempt.scenarioSlug,
        attempt.scenarioVersion,
        JSON.stringify(attempt.graph),
        attempt.tradeOffs,
        JSON.stringify(attempt.evaluation),
        attempt.createdAt,
      ],
    );
    return mapAttempt(result.rows[0]);
  }
}
