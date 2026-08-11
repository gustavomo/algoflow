# AlgoFlow

AlgoFlow is a personal software-engineering learning workspace with animated lessons, deterministic assessments, spaced review, technical reading, system-design practice, Web Push reminders, and grounded AI explanations. It is designed for one learner, runs fully offline with server-side mocks, and uses independently deployable Next.js web and API applications.

## Included MVP

- Nine tracks, 25 learning paths, 14 complete lessons, and 14 deterministic assessments
- Roadmaps for software engineering, JavaScript, Go, patterns, System Design, networking/CDNs, databases, PostgreSQL, MySQL, Docker, Kubernetes, AWS, mathematics, AI/ML/deep learning, agentic engineering, English, technical reading, and learning how to learn
- SVG and Framer Motion visualizations for Bubble Sort, pointer patterns, complexity, and reusable concept flows
- Optional PixiJS scaffold for grid traversal scenes
- XState playback with play, pause, seek, step, speed, keyboard controls, and reduced-motion support
- Monaco code editor loaded only in the browser
- Deterministic assessments that create concept-level review items
- Server-persisted focused path with honest available/planned progress
- Technical reading library with chapter progress, private notes, and explicit note-to-review conversion
- System Design Lab with editable SVG topologies, animated traffic, deterministic rubrics, attempt history, and explicitly applied AI patch previews
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

The example environment enables mock access, mock persistence, and mock AI. `npm run dev` starts the web on `http://localhost:3000` and the API on `http://localhost:4000`. Mock persistence lives in the API process and resets when that process restarts; nothing is stored in browser local storage.

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

| Variable                       | Application | Required in production | Purpose                                                                      |
| ------------------------------ | ----------- | ---------------------- | ---------------------------------------------------------------------------- |
| `APP_ACCESS_CODE`              | Web         | Yes                    | Shared code used to enter the personal instance.                             |
| `ACCESS_COOKIE_SECRET`         | Web         | Yes                    | Secret used to sign the access cookie; use at least 32 random characters.    |
| `MOCK_ACCESS`                  | Web         | No                     | Set to `1` only for local access bypass.                                     |
| `BACKEND_URL`                  | Web         | Yes                    | Private base URL of the independently deployed API.                          |
| `BACKEND_SHARED_SECRET`        | Both        | Yes                    | Server-only token authenticating web-to-API requests.                        |
| `DATABASE_URL`                 | API         | Yes                    | PostgreSQL connection string and durable source of truth.                    |
| `MOCK_PERSISTENCE`             | API         | No                     | Set to `1` for API-memory local development.                                 |
| `OPENAI_API_KEY`               | API         | No                     | Enables real AI explanations; an empty value automatically selects the mock. |
| `MOCK_AI`                      | API         | No                     | Set to `1` to force deterministic offline explanations.                      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web         | For push               | Public VAPID key exposed to the browser.                                     |
| `VAPID_PUBLIC_KEY`             | API         | For push               | Matching public VAPID key used by the sender.                                |
| `VAPID_PRIVATE_KEY`            | API         | For push               | Server-only VAPID private key.                                               |
| `VAPID_SUBJECT`                | API         | For push               | Contact URI, normally `mailto:you@example.com`.                              |
| `CRON_SECRET`                  | API         | For push               | Bearer secret protecting the reminder endpoint.                              |
| `REMINDER_TIMEZONE`            | API         | No                     | IANA timezone used to deduplicate the daily reminder window.                 |

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

The endpoint also accepts `POST { "q": "...", "tech": "ts", "topK": 5 }`. Retrieval uses normalized token matching and TF-IDF-inspired scoring over the API's versioned local chunks. The `Retriever` port is the seam for a future pgvector adapter.

Curriculum retrieval also accepts `domain`, allowing the same store to distinguish areas such as cloud, data, AI, and communication while preserving the original technology filter.

### AI explanation

```http
POST /api/ask
Content-Type: application/json

{ "question": "Why does the largest item settle after a pass?", "tech": "js", "citations": ["js/bubble-sort#1"] }
```

The response contains `{ answer, citations, provider, cached }`. If citations are omitted, the server retrieves local context first. Explicit unknown citation IDs are rejected, and the provider receives only resolved local context.

### Learning state

- `GET|POST /api/progress` reads the snapshot or updates a lesson.
- `GET|POST /api/focus` reads or changes the server-persisted focused path.
- `POST /api/assessments` grades and stores an attempt.
- `GET|POST /api/reviews` lists due concepts or records a review rating.
- `GET|POST /api/notifications/preferences` reads or updates reminder settings.
- `POST|DELETE /api/notifications/subscription` manages a push subscription.
- `GET /api/v1/notifications/send-due` on the API deployment is the protected cron target.

### Reading workspace

- `GET|POST|PATCH|DELETE /api/reading` lists, creates, updates, or deletes books.
- `POST|DELETE /api/reading/notes` manages chapter notes.
- `POST /api/reading/review` explicitly converts a private note into a spaced-review prompt.

Reading notes are never added to local retrieval or AI context. Only the learner-authored prompt and answer from an explicit conversion enter the review queue.

### System Design Lab

- `GET /api/simulations` lists scenarios; `?slug=...` restores one workspace.
- `POST /api/simulations/draft` validates and saves one mutable draft per scenario.
- `POST /api/simulations/proposal` returns a validated AI patch and preview graph without persisting it.
- `POST /api/simulations/evaluate` stores an immutable deterministic attempt and schedules failed rubric concepts for review.

The canonical score comes from versioned server rules, never from the AI provider. The offline mock and `gpt-4o-mini` provider share the same constrained patch boundary.

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

1. Create two Vercel projects from the repository, rooted at `apps/api` and `apps/web`.
2. Provision PostgreSQL, configure API/provider/push variables on the API project, and run `npm run db:migrate` from the repository root.
3. Deploy the API first. Its `vercel.json` registers `/api/v1/notifications/send-due` at `13:00 UTC`.
4. Configure the web project with access variables, the deployed `BACKEND_URL`, the same `BACKEND_SHARED_SECRET`, and the public VAPID key.
5. Deploy the web, open its HTTPS URL, enter the access code, and enable reminders from the dashboard.

The daily cron is a reminder window, not an exact alarm. Users who decline browser push still retain the in-app review queue.

## Architecture notes

- The npm workspace contains `apps/web`, `apps/api`, and `packages/contracts`; the browser never receives database or provider credentials.
- The API is a modular monolith organized by product capability. Domain and application modules depend on ports, and framework/provider code lives in adapters.
- Lesson MDX remains server-rendered in the web; interactive players, assessments, notifications, and Monaco are isolated client components.
- Animations consume immutable algorithm snapshots and only render state transitions.
- Grading is deterministic. AI explains results but never decides correctness or mastery.
- AI system-design proposals are validated previews; only an explicit apply followed by save changes a draft.
- Technical notes stay private to reading persistence and are excluded from RAG and provider prompts.
- PostgreSQL is authoritative in deployed environments; browser storage is not used for learning state.
- Caches are in-process optimizations only and never replace durable learning records.
