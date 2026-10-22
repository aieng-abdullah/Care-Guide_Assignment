# AI Prompts Log
**Project:** Intelligent API Monitoring & Alert System
**Developer:** <name>

---

## Prompt #1
- **Date/Time:** 2026-10-22 00:01
- **AI Tool / Model:** OpenCode / opencode-big-pickle
- **Category:** Docs
- **Related file(s):** docs/prd.md, docs/Architecture .md, AGENTS.md
- **Prompt (clean version):**
> Build the project documentation set for the Intelligent API Monitoring & Alert System (Node.js/Express, MongoDB, LLM alerts, React/plain frontend). Goal: PRD covering goals, input schema, functional requirements (detection rules, AI alerts, storage, REST API, frontend, batch, errors, optional email), non-functional requirements, architecture, tech stack, acceptance criteria; plus an architecture document and a compact `AGENTS.md` instruction file so future AI sessions avoid mistakes. Constraints: interview submission rules (mandatory prompt logging, git hygiene, security) captured in AGENTS.md; requirements are the assignment brief.
- **Result summary:** Produced `docs/prd.md` (full requirements, FR-1..FR-9, acceptance criteria), `docs/Architecture .md`, and `AGENTS.md` (instruction file with logging, stack, layered architecture, coding standards).
- **Used as-is / Modified / Rejected:** Modified — AGENTS.md condensed from a full draft (duplicates merged), prompt-logging rule narrowed to project-building prompts only per follow-up.

---

## Prompt #2
- **Date/Time:** 2026-10-22 00:25
- **AI Tool / Model:** OpenCode / opencode-big-pickle
- **Category:** Code generation
- **Related file(s):** backend/package.json, backend/src/config/index.js, backend/src/config/thresholds.js, backend/src/utils/logger.js, backend/src/middleware/requestLogger.js, backend/src/middleware/errorHandler.js, backend/src/middleware/rateLimit.js, backend/src/routes/health.routes.js, backend/src/app.js, backend/src/server.js, backend/eslint.config.js, backend/.env.example
- **Prompt (clean version):**
> Phase 1 (Day 1) backend foundation on branch `feat/backend-foundation`. Init `backend/` with Express, Mongoose, Zod, Winston, dotenv, helmet, cors, express-rate-limit, p-limit, openai plus ESLint/Jest/Supertest/Nodemon dev tools. Folder structure per ARCHITECTURE.md section 12. Build: `config/index.js` (env load + fail-fast validation), `config/thresholds.js` (response-time thresholds from env), `utils/logger.js` (Winston, console + file), `middleware/requestLogger.js` (request ID + per-request logging), `middleware/errorHandler.js` (central handler, standard `{ error: { code, message, details } }` shape, 404 handler), `app.js` and `server.js` (Express wiring, MongoDB connection, graceful SIGTERM shutdown), `routes/health.routes.js` (GET /health with DB connectivity check). Verify server starts, /health returns 200, log line written.
- **Result summary:** Full backend scaffold with layered structure, fail-fast config, structured logging, request IDs, standard error shape, health endpoint reporting Mongo status; verified /health 200 + log lines + clean SIGTERM shutdown against local MongoDB.
- **Used as-is / Modified / Rejected:** Used as-is.

---

## Prompt #3
- **Date/Time:** 2026-10-22 00:33
- **AI Tool / Model:** OpenCode / opencode-big-pickle
- **Category:** Code generation
- **Related file(s):** backend/src/middleware/validate.js, backend/src/services/rules/*.rule.js, backend/src/services/rules/index.js, backend/src/services/detector.service.js, backend/src/utils/fingerprint.js, backend/tests/rules.test.js, backend/tests/validate.test.js, backend/data/sample-input.json
- **Prompt (clean version):**
> Phase 2 detection engine on branch `feat/anomaly-detector`. Zod validation middleware for `POST /monitor` (api_name charset-restricted, response_time_ms >= 0, status_code 100-599, records_returned nullable — null/missing is itself MISSING_DATA; unknown fields rejected with 400 + field details). Pure rule functions in `services/rules/` (one file each): HIGH_RESPONSE_TIME (warn >3000ms, critical >5000ms, env-configurable), FAILED_REQUEST (>=500 critical), CLIENT_ERROR (400-499 warning), ZERO_RECORDS (0 records on 2xx warning), MISSING_DATA (null/missing records warning). `detector.service.js` runs the registry, combines rules into one result per API, picks highest severity. `utils/fingerprint.js`: sha256 of api_name + sorted rules. Unit tests for every rule edge (exactly at threshold, 4xx vs 5xx, null records, healthy input) plus the two assignment samples: healthy -> no anomaly; 5500ms/500/0-records -> critical.
- **Result summary:** Rule registry of 5 pure functions, combined detector, sha256 fingerprint, strict batch validation, sample-input.json; 38 Jest tests passing, ESLint clean; assignment samples verified.
- **Used as-is / Modified / Rejected:** Modified during verification — one detector test expectation corrected (ZERO_RECORDS is 2xx-only, so a 404+0-records record triggers CLIENT_ERROR only).

---

## Prompt #4
- **Date/Time:** 2026-10-22 01:08
- **AI Tool / Model:** OpenCode / opencode-big-pickle
- **Category:** Code generation
- **Related file(s):** backend/src/services/prompts/alertPrompt.v1.js, backend/src/services/providers/openai.provider.js, backend/src/services/aiAlert.service.js, backend/src/models/alert.model.js, backend/src/repositories/alert.repository.js, backend/src/utils/concurrency.js, backend/src/services/monitor.service.js, backend/src/controllers/monitor.controller.js, backend/src/controllers/alerts.controller.js, backend/src/routes/monitor.routes.js, backend/src/routes/alerts.routes.js, backend/src/middleware/validate.js, backend/src/app.js, backend/tests/api.integration.test.js
- **Prompt (clean version):**
> Phase 3 on `feat/llm-alerts`: LLM alert generation, MongoDB storage, and REST endpoints. Versioned prompt `alertPrompt.v1.js` (delimited `<anomaly_data>` block, injection-safe system prompt). OpenAI provider adapter (temperature 0.3, max_tokens 80, timeout + retries from config) behind a provider interface; `aiAlert.service` always resolves with `alert_source: "llm"` or deterministic fallback on failure/empty. Alert model per PRD FR-4 with fingerprint, occurrences, last_seen, indexes. Repository: atomic upsert dedup (same api_name + fingerprint active -> increment occurrences), paginated active listing with severity/api_name filters, resolve by id. Monitor service: per-item Zod validation inside the batch (valid items still process when some are invalid), bounded LLM concurrency via p-limit@3, per-item failure isolation. Routes: POST /monitor (rate-limited), GET /alerts, PATCH /alerts/:id/resolve. Integration tests with mocked OpenAI: summary correctness, fallback on LLM failure and empty response, bad-item isolation, dedup occurrences, filters, pagination, resolve, 404s.
- **Result summary:** Full monitor/alert pipeline; 53/53 tests green, ESLint clean; live smoke: sample batch stored one critical alert with fallback text, GET /alerts filters worked. Notes: mongoose pinned to v8 (v9 + mongodb7 driver rejected under Jest); p-limit pinned to v3 (v4+ ESM breaks Jest CJS).
- **Used as-is / Modified / Rejected:** Modified — upsert `$setOnInsert`/`$inc` conflict on `occurrences` fixed by dropping it from `$setOnInsert`.

---

## Prompt #5
- **Date/Time:** 2026-10-22 21:15
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Code generation
- **Related file(s):** frontend/package.json, frontend/vite.config.js, frontend/index.html, frontend/eslint.config.js, frontend/src/main.jsx, frontend/src/App.jsx, frontend/src/api.js, frontend/src/styles.css, frontend/src/components/SummaryBar.jsx, frontend/src/components/Filters.jsx, frontend/src/components/AlertList.jsx, frontend/src/components/AlertCard.jsx, frontend/src/components/MonitorForm.jsx
- **Prompt (clean version):**
> Phase 4 frontend (FR-6) on `feat/llm-alerts`: React + Vite dashboard in `frontend/`. Requirements: list active alerts with API name, severity badge, AI message, metrics, rules triggered, first/last seen, occurrences count; filter by severity and API name; manual refresh plus optional 10s auto-refresh; summary counters (total/critical/warning); per-alert Resolve button calling `PATCH /alerts/:id/resolve`; textarea to paste a JSON batch and submit to `POST /monitor` with the run summary shown and per-item failure details surfaced; loading, empty, and error states; responsive layout, severity color-coded. Vite dev proxy for `/monitor`, `/alerts`, `/health` to localhost:3000. Flat ESLint config (js recommended + react-hooks + react/jsx-uses-vars). Match backend response shapes (`GET /alerts` returns `{data,total,page,limit}`; `/monitor` summary uses `failures` with `details`).
- **Result summary:** 11 source files; ESLint clean, Vite build ~1.5s; live smoke: batch POST produced 1 healthy/1 anomaly/1 failed isolation, fallback message displayed path, resolve emptied the active list through the Vite proxy. Dep notes: frontend eslint pinned ^9 (react-hooks peer), eslint-plugin-react added for JSX var usage.
- **Used as-is / Modified / Rejected:** Modified — initial eslint ^10 conflicted with react-hooks peer range (pinned ^9); `failures` field name corrected in MonitorForm after checking backend summary shape.

---

## Prompt #6
- **Date/Time:** 2026-10-22 21:40
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Docs
- **Related file(s):** README.md
- **Prompt (clean version):**
> Rewrite root README for the Intelligent API Monitoring & Alert System. Must let a new developer run the project in under 10 minutes (acceptance criterion). Sections: one-line overview, feature list (detection rules, LLM alerts with fallback, dedup, batch isolation, dashboard, ops), tech stack table, prerequisites (Node 18+, Docker Mongo, optional OpenAI key — without key fallback works), quick start (clone, docker mongo, backend cp .env.example/install/dev, frontend install/dev, curl smoke tests), API table with request/response shapes, configuration table mapping every .env variable to default and meaning, lint/test commands with actual counts, project structure tree matching AGENTS layering, doc links (prd, prompt log, AGENTS). No secrets, only .env.example placeholders.
- **Result summary:** Full README (~140 lines) covering setup, API, config table, structure, docs links; verified sample-input.json is a valid array for the curl smoke test and doc links resolve.
- **Used as-is / Modified / Rejected:** Modified — dropped a misleading jq-wrap note after confirming the sample payload already posts as an array.
