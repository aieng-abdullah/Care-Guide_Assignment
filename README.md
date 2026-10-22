# Intelligent API Monitoring & Alert System

Monitors API response data, detects anomalies with configurable rules, generates human-readable alerts through an LLM (OpenRouter free model) with a deterministic fallback, stores them in MongoDB, and surfaces them in a REST API and React dashboard.

## The problem

Businesses integrate with many external APIs (patient data, appointments, lab results, billing). These APIs fail intermittently: they slow down, return 5xx/4xx, or return empty/incomplete payloads while looking "up". In practice that means:

- **Silent degradation** — an endpoint returns 200 with 0 records; nobody notices until downstream processes or patients are affected.
- **Raw, unreadable signals** — status codes and latency numbers live in scattered logs; operators must interpret them under pressure.
- **No shared view** — engineers and support staff cannot see "what is broken right now" in one place, in plain language.
- **Alert fatigue and blind spots** — naive alerting floods on repeats, while LLM-generated explanations usually arrive only when someone writes them by hand.

**What this system solves:** it ingests API response metrics in batches, evaluates them against configurable detection rules, turns every anomaly into a short human-readable message via an LLM (with guaranteed fallback), deduplicates repeats, persists everything, and presents active incidents on a dashboard with filters and one-click resolve. Operators get "AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue." instead of a log line.

## Features

- **Anomaly detection** — 5 pure rule functions: high response time (warn/critical thresholds), 5xx failures, 4xx client errors, zero records on 2xx, missing records; one combined alert per API per run
- **LLM alert text** — short human-readable message via an OpenRouter free model (`minimax/minimax-m3.1-flash:free`, configurable), prompt-injection-safe delimited input, automatic fallback template when the LLM is missing, fails, times out, or returns empty (`alert_source: "fallback"`)
- **Deduplication** — active alerts for the same API + rule set increment `occurrences` and update `last_seen` instead of creating duplicates
- **Batch processing** — up to 100 items per `POST /monitor`; one bad item never blocks the rest; LLM calls concurrency-limited (default 5)
- **Dashboard** — React (Vite): alert cards with severity, metrics, AI message; filters; auto-refresh; resolve button; JSON submit form
- **Ops** — structured Winston logging (console + file), central JSON error middleware, rate limiting, Zod validation, graceful shutdown

## Architecture

```
JSON file / POST /monitor
        │
   Validation (Zod) ── rate limit ── error middleware
        │
   Monitor Service (batch orchestrator, bounded concurrency)
        ├──► Detector (rule registry — 5 pure functions)
        ├──► AI Alert Service (provider adapter ► LLM API
        │                       └── on failure/timeout/empty ──► fallback template)
        └──► Alert Repository (atomic upsert, dedup) ──► MongoDB
                                                          │
   React dashboard ◄── GET /alerts, PATCH /resolve ────────┘
```

Strict layering — dependencies flow one way: `routes → controllers → services → repositories → models`. Routes map URLs, controllers shape HTTP responses, services hold all business logic, repositories own DB access. Detection rules are pure functions `(response, thresholds) → anomaly | null`, so a new rule is one file, no edits to existing logic.

Request flow for a batch:

1. **Validate** — array bounds at the edge, per-item Zod schema inside the service (one bad item is reported, never blocks the rest).
2. **Detect** — rule registry combines all triggered rules into one anomaly per API, highest severity wins.
3. **Generate** — only anomalies call the LLM; healthy items cost nothing. Failure → deterministic fallback (`alert_source: "fallback"`).
4. **Persist** — fingerprint-based upsert: repeat anomaly increments `occurrences`, no duplicate active alerts.
5. **Respond** — `{ processed, healthy, anomalies, failed, alerts, failures }`.

Full diagrams, data model, and indexes: [`docs/Architecture .md`](docs/Architecture%20.md).

## Key design decisions

| Decision | Why | Trade-off |
|---|---|---|
| Layered architecture (routes → controllers → services → repositories) | Testable, single-responsibility files, easy review | A few more files |
| Rule registry of pure functions | Extend with one new file; unit-test edges (exactly at threshold, 4xx vs 5xx, null) | Slight indirection |
| LLM only for anomalies, low temp + token cap | Cost and latency stay proportional to real problems | Healthy APIs get no AI text (not needed) |
| Deterministic fallback template | LLM outage can never lose an alert | Less descriptive text in fallback mode |
| Provider adapter behind an interface | OpenAI-compatible APIs (OpenRouter/OpenAI/Gemini-style endpoints) swap via config | Small abstraction layer |
| Fingerprint dedup via partial unique index + atomic upsert | No alert spam, safe under concurrent requests | Needs MongoDB partial index |
| Per-item isolation (`allSettled` semantics) + p-limit concurrency (5) | One failed item or LLM call never breaks the batch; rate limits respected | Bounded throughput by design |
| Prompt-injection safety: strict `api_name` charset + delimited data block | API input is data, never instructions | Rejects loosely formatted names |
| Stateless server, all state in MongoDB | Horizontal scaling, survives restart | No in-memory caching |
| Sync processing now, queue-ready services | Immediate feedback at this scale; deps injected so BullMQ slots in later | Queue needed at much larger scale |

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js 18+, Express 5 |
| Database | MongoDB (Mongoose 8) |
| LLM | OpenRouter free model via OpenAI-compatible API |
| Validation | Zod |
| Logging | Winston |
| Frontend | React 18 + Vite |
| Tests | Jest + Supertest |

## Prerequisites

- Node.js 18 or newer
- Docker (for MongoDB) — or any MongoDB 6+ instance
- Optional: free OpenRouter API key (https://openrouter.ai/keys; without it, all alerts use the fallback template)

## Quick start

```bash
git clone https://github.com/aieng-abdullah/Care-Guide_Assignment.git
cd Care-Guide_Assignment
```

### 1. MongoDB

```bash
docker run -d --name api-monitor-mongo -p 27017:27017 mongo:7
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # paste a free key from openrouter.ai/keys for LLM text
npm install
npm run dev                 # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies API to :3000)
```

Open http://localhost:5173. The sample batch is pre-filled in the submit form.

### 4. Smoke test

```bash
curl -s localhost:3000/health
curl -s -X POST localhost:3000/monitor \
  -H 'Content-Type: application/json' \
  -d @backend/data/sample-input.json
curl -s localhost:3000/alerts
```

Static JSON file input (alternative to curl):

```bash
cd backend
npm run monitor:file -- data/sample-input.json   # or -- --url=http://host:3000
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/monitor` | Submit batch of API responses; returns `{ processed, healthy, anomalies, failed, alerts, failures }` |
| `GET` | `/alerts` | Active alerts; `?severity=warning\|critical`, `?api_name=`, `?page=`, `?limit=` |
| `PATCH` | `/alerts/:id/resolve` | Mark alert resolved |
| `GET` | `/health` | Service + DB health |

Input item shape:

```json
{
  "api_name": "PatientDataAPI",
  "response_time_ms": 1200,
  "status_code": 200,
  "records_returned": 50
}
```

## Configuration

All tunables live in `backend/.env` (see `backend/.env.example`):

| Variable | Default | Meaning |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/api-monitor` | Database connection |
| `THRESHOLD_RESPONSE_WARN_MS` | `3000` | Response-time warning threshold |
| `THRESHOLD_RESPONSE_CRIT_MS` | `5000` | Response-time critical threshold |
| `LLM_BASE_URL` | `https://openrouter.ai/api/v1` | OpenAI-compatible API endpoint |
| `LLM_MODEL` | `minimax/minimax-m3.1-flash:free` | Any OpenRouter free model id |
| `LLM_API_KEY` | — | OpenRouter key; empty → fallback templates |
| `LLM_TIMEOUT_MS` | `5000` | LLM request timeout |
| `LLM_CONCURRENCY` | `5` | Max parallel LLM calls |
| `RATE_LIMIT_MAX` | `100` | Requests per window on `/monitor` |
| `EMAIL_ENABLED` | `false` | Optional email reports |

## Tests and lint

```bash
cd backend && npm run lint && npm test   # 53 tests (rules, validation, integration)
cd frontend && npm run lint && npm run build
```

Integration tests mock the LLM HTTP client and require MongoDB running.

## Project structure

```
backend/src/
  config/        env loading + thresholds (fail-fast)
  routes/        URL mapping only
  controllers/   request/response shaping
  services/      monitor, detector, aiAlert, rules registry, prompts, providers
  models/        Mongoose schemas
  repositories/  DB access, dedup upsert, pagination
  middleware/    validation, error handler, rate limit, request logger
  utils/         logger, fingerprint, concurrency
frontend/src/    React dashboard (components, api client, styles)
docs/            prd.md, AI_Prompts.md, Architecture
```

## Documentation

- [Product requirements](docs/prd.md)
- [Architecture](docs/Architecture%20.md) — diagrams, data model, scalability, full decision table
- [AI prompt log](docs/AI_Prompts.md) — every project-building prompt, including every version of the runtime alert prompt
- `AGENTS.md` — coding standards, architecture rules, submission checklist
