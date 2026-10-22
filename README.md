# Intelligent API Monitoring & Alert System

Monitors API response data, detects anomalies with configurable rules, generates human-readable alerts through an LLM (OpenAI) with a deterministic fallback, stores them in MongoDB, and surfaces them in a REST API and React dashboard.

## Features

- **Anomaly detection** — 5 pure rule functions: high response time (warn/critical thresholds), 5xx failures, 4xx client errors, zero records on 2xx, missing records; one combined alert per API per run
- **LLM alert text** — short human-readable message via OpenAI (`gpt-4o-mini`), prompt-injection-safe delimited input, automatic fallback template when the LLM is missing, fails, times out, or returns empty (`alert_source: "fallback"`)
- **Deduplication** — active alerts for the same API + rule set increment `occurrences` and update `last_seen` instead of creating duplicates
- **Batch processing** — up to 100 items per `POST /monitor`; one bad item never blocks the rest; LLM calls concurrency-limited (default 5)
- **Dashboard** — React (Vite): alert cards with severity, metrics, AI message; filters; auto-refresh; resolve button; JSON submit form
- **Ops** — structured Winston logging (console + file), central JSON error middleware, rate limiting, Zod validation, graceful shutdown

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js 18+, Express 5 |
| Database | MongoDB (Mongoose 8) |
| LLM | OpenAI SDK (`gpt-4o-mini`) |
| Validation | Zod |
| Logging | Winston |
| Frontend | React 18 + Vite |
| Tests | Jest + Supertest |

## Prerequisites

- Node.js 18 or newer
- Docker (for MongoDB) — or any MongoDB 6+ instance
- Optional: OpenAI API key (without it, all alerts use the fallback template)

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
cp .env.example .env        # add LLM_API_KEY if you have one
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
| `LLM_API_KEY` | — | OpenAI key; empty → fallback templates |
| `LLM_TIMEOUT_MS` | `5000` | LLM request timeout |
| `LLM_CONCURRENCY` | `5` | Max parallel LLM calls |
| `RATE_LIMIT_MAX` | `100` | Requests per window on `/monitor` |
| `EMAIL_ENABLED` | `false` | Optional email reports |

## Tests and lint

```bash
cd backend && npm run lint && npm test   # 53 tests (rules, validation, integration)
cd frontend && npm run lint && npm run build
```

Integration tests mock the OpenAI SDK and require MongoDB running.

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
- [AI prompt log](docs/AI_Prompts.md) — every project-building prompt, including every version of the runtime alert prompt
- `AGENTS.md` — coding standards, architecture rules, submission checklist
