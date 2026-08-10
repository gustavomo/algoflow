# AlgoFlow

AlgoFlow is a personal algorithm-learning workspace with animated lessons, deterministic assessments, spaced review, Web Push reminders, and grounded AI explanations. It is designed for one learner, runs fully offline with server-side mocks, and can be deployed to Vercel with PostgreSQL.

## Included MVP

- Six lessons grouped into four topics and three learning paths
- SVG and Framer Motion visualizations for Bubble Sort, pointer patterns, and complexity
- Optional PixiJS scaffold for grid traversal scenes
- XState playback with play, pause, seek, step, speed, keyboard controls, and reduced-motion support
- Monaco code editor loaded only in the browser
- Deterministic assessments that create concept-level review items
- Server-owned progress, attempts, mastery, spaced-review state, and push subscriptions
- In-app review queue plus daily Web Push reminders
- Local JSON RAG with a swappable retriever interface
- `gpt-4o-mini` explanations with deterministic mock fallback
- Shared instance access code; no user account system

## Quick start: fully offline

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The example environment enables mock access, mock persistence, and mock AI. Open `http://localhost:3000`. Mock persistence lives in the Node.js server process and resets when that process restarts; nothing is stored in browser local storage.

## PostgreSQL development

Create a PostgreSQL database, then change these values in `.env.local`:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/algoflow
MOCK_PERSISTENCE=0
```

Apply the idempotent schema and start the app:

```bash
npm run db:migrate
npm run dev
```

Production requires `DATABASE_URL`; the in-memory repository is intended only for local development and tests.

## Environment variables

| Variable                       | Required in production | Purpose                                                                      |
| ------------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `APP_ACCESS_CODE`              | Yes                    | Shared code used to enter the personal instance.                             |
| `ACCESS_COOKIE_SECRET`         | Yes                    | Secret used to sign the access cookie; use at least 32 random characters.    |
| `MOCK_ACCESS`                  | No                     | Set to `1` only for local access bypass.                                     |
| `DATABASE_URL`                 | Yes                    | PostgreSQL connection string and durable source of truth.                    |
| `MOCK_PERSISTENCE`             | No                     | Set to `1` for server-memory local development.                              |
| `OPENAI_API_KEY`               | No                     | Enables real AI explanations; an empty value automatically selects the mock. |
| `MOCK_AI`                      | No                     | Set to `1` to force deterministic offline explanations.                      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push               | Public VAPID key exposed to the browser.                                     |
| `VAPID_PRIVATE_KEY`            | For push               | Server-only VAPID private key.                                               |
| `VAPID_SUBJECT`                | For push               | Contact URI, normally `mailto:you@example.com`.                              |
| `CRON_SECRET`                  | For push               | Bearer secret protecting the reminder endpoint.                              |
| `REMINDER_TIMEZONE`            | No                     | IANA timezone used to deduplicate the daily reminder window.                 |

Generate VAPID keys with the installed Web Push CLI:

```bash
npx web-push generate-vapid-keys
```

## API contracts

All private APIs are protected by the access middleware. Mutating browser requests also require a same-origin request.

### RAG

```http
GET /api/rag?q=sliding%20window&tech=ts&topK=5
```

```json
{
  "chunks": [
    {
      "id": "ts/sliding-window#1",
      "tech": "ts",
      "topic": "sliding-window",
      "step": 1,
      "content": "..."
    }
  ]
}
```

The endpoint also accepts `POST { "q": "...", "tech": "ts", "topK": 5 }`. Retrieval uses normalized token matching and TF-IDF-inspired scoring over `lib/rag/chunks.json`. The `Retriever` interface is the seam for a future pgvector adapter.

### AI explanation

```http
POST /api/ask
Content-Type: application/json

{ "question": "Why does the largest item settle after a pass?", "tech": "js", "citations": ["js/bubble-sort#1"] }
```

The response contains `{ answer, citations, provider, cached }`. If citations are omitted, the server retrieves local context first. Explicit unknown citation IDs are rejected, and the provider receives only resolved local context.

### Learning state

- `GET|POST /api/progress` reads the snapshot or updates a lesson.
- `POST /api/assessments` grades and stores an attempt.
- `GET|POST /api/reviews` lists due concepts or records a review rating.
- `GET|POST /api/notifications/preferences` reads or updates reminder settings.
- `POST|DELETE /api/notifications/subscription` manages a push subscription.
- `GET /api/notifications/send-due` is the protected cron target.

## Quality scripts

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

`npm run check` runs type checking, linting, unit tests, and the production build in sequence.

## Deploy to Vercel

1. Provision PostgreSQL and set `DATABASE_URL` in the Vercel project.
2. Run `npm run db:migrate` against that production database before first use.
3. Configure the access, AI, VAPID, and cron environment variables listed above.
4. Deploy the repository. `vercel.json` registers a daily call to `/api/notifications/send-due` at `13:00 UTC`.
5. Open the deployed HTTPS URL, enter the access code, and enable reminders from the dashboard. Notification permission is always requested through an explicit user action.

The daily cron is a reminder window, not an exact alarm. Users who decline browser push still retain the in-app review queue.

## Architecture notes

- Lesson MDX remains server-rendered; interactive players, assessments, notifications, and Monaco are isolated client components.
- Animations consume immutable algorithm snapshots and only render state transitions.
- Grading is deterministic. AI explains results but never decides correctness or mastery.
- PostgreSQL is authoritative in deployed environments; browser storage is not used for learning state.
- Caches are in-process optimizations only and never replace durable learning records.
