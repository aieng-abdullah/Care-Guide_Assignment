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

---

## Prompt #7
- **Date/Time:** 2026-10-23 02:55
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Docs
- **Related file(s):** README.md
- **Prompt (clean version):**
> Polish README with three missing narrative sections: (1) The problem — why the system exists: external APIs fail intermittently and silently (200 with 0 records), raw signals scattered across logs, no shared "what is broken right now" view, alert fatigue from repeats; state concretely what the system solves with an example operator-facing sentence. (2) Architecture — ASCII pipeline diagram (input → validation → monitor service → detector/AI service/repository → MongoDB → dashboard), one-way layering explanation, and the 5-step request flow for a batch. (3) Key design decisions — distilled Decision/Why/Trade-off table covering layering, rule registry, LLM-only-for-anomalies, fallback, provider adapter, fingerprint dedup, per-item isolation + concurrency, prompt-injection safety, stateless server, sync-now-queue-later; source from docs/Architecture .md section 13 but shorter for README reading. Link the full architecture doc from Documentation section.
- **Result summary:** README grew from 138 to 193 lines with problem/architecture/decisions sections; all internal links verified resolving (incl. URL-encoded `Architecture .md`); one grammar fix applied.
- **Used as-is / Modified / Rejected:** Modified — corrected a missing "via" in the problem statement and an "LLM" typo in the decisions table before committing.

---

## Prompt #8
- **Date/Time:** 2026-10-23 03:20
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Code generation
- **Related file(s):** backend/src/services/aiAlert.service.js, backend/tests/fallback.test.js, backend/scripts/monitor-file.js, backend/package.json, backend/eslint.config.js, README.md
- **Prompt (clean version):**
> Close two gaps against the original assignment brief. (1) Fallback alert wording: current template leads with rule codes ("AppointmentAPI triggered HIGH_RESPONSE_TIME, FAILED_REQUEST (severity: critical) — ...") but the brief's example is a plain sentence: "AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue." Rewrite `buildFallbackMessage` to compose plain-language parts from rules + metrics (failed with status X / returned status X / was slow (X ms) / returned 0 records / returned an unknown record count — record clauses from `metrics.records_returned`, not the ZERO_RECORDS rule, since that rule is 2xx-only yet the example mentions 0 records on a 500) ending with "Possible outage or data issue." Add unit tests: PRD example sentence exact match, client-error phrasing, missing-record phrasing, cause-sentence suffix. (2) Static JSON file input method from brief section 5: `scripts/monitor-file.js` reading a JSON array file and POSTing it to `/monitor` (`--url` or `MONITOR_URL` override), exposed as `npm run monitor:file`. Include `scripts/` in lint; add missing eslint globals (`it` in tests, node globals for scripts); pin backend eslint to ^9 because eslint 10 requires Node >=20.19 while the project declares Node 18 (eslint 10 formatter crashes via `util.styleText` on Node 18 whenever lint errors exist). Update README quick start with the CLI.
- **Result summary:** Fallback now reads "AppointmentAPI failed with status 500, was slow (5500 ms), returned 0 records. Possible outage or data issue." (live-verified through /monitor); 57/57 tests (4 new fallback tests); lint clean on eslint 9 covering src+tests+scripts; `npm run monitor:file -- data/sample-input.json` smoke-tested end-to-end.
- **Used as-is / Modified / Rejected:** Modified — record clauses rebased from rule IDs to raw metrics so the assignment's 500+0-records example sentence comes out verbatim; two orphaned node server processes from an earlier PID-kill cleaned up during smoke testing.

---

## Prompt #9
- **Date/Time:** 2026-10-23 04:05
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Refactor
- **Related file(s):** backend/src/services/providers/openaiCompat.provider.js, backend/src/services/providers/openai.provider.js, backend/src/services/aiAlert.service.js, backend/src/config/index.js, backend/.env.example, README.md, docs/Architecture .md
- **Prompt (clean version):**
> Switch the LLM provider from OpenAI to OpenRouter with a free model; the official assignment allows any LLM API. Keep the OpenAI SDK (OpenRouter is OpenAI-compatible) but add config-driven `LLM_BASE_URL` (default `https://openrouter.ai/api/v1`) so any compatible endpoint works. Defaults: `LLM_PROVIDER=openrouter`, `LLM_MODEL=minimax/minimax-m3.1-flash:free` (top-ranked free model at the time), `LLM_TIMEOUT_MS=10000` in .env.example (free models cold-start slower). Rename `openai.provider.js` → `openaiCompat.provider.js` / `createOpenAICompatProvider` so naming matches reality. Make the client lazy (init on first `complete()` call) with `apiKey || 'not-configured'` sentinel: the OpenAI SDK throws at construction on an empty key, which crashed module import (fallback.test.js required aiAlert.service); lazy init makes a missing key fail inside `generate()`'s try/catch so it degrades to the fallback template. Update README (intro, features, decisions, tech stack, prerequisites, config table, test note) and the architecture doc's provider filename. Do not touch PRD/AGENTS (historical specs).
- **Result summary:** Live smoke: request reaches OpenRouter (401 auth on empty key) and falls back with the PRD-style message; 57/57 tests, lint clean (integration mocks SDK so mocked path still reports `alert_source: llm`). `.env` left with empty `LLM_API_KEY` for a real `sk-or-v1-` key.
- **Used as-is / Modified / Rejected:** Modified — explicit "LLM_API_KEY not configured" guard removed after it broke the mocked integration test (throws before the mocked client runs); sentinel inside lazy `getClient()` achieves import-safety without short-circuiting tests.

---

## Prompt #10
- **Date/Time:** 2026-10-23 04:40
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Code generation
- **Related file(s):** api/index.js, vercel.json, package.json, backend/src/db.js, backend/src/app.js, backend/src/server.js, backend/src/utils/logger.js, README.md
- **Prompt (clean version):**
> Deploy the whole system on Vercel as a single project to stand out: Express backend as one serverless function + React dashboard as static build, same origin. Constraints: no code rewrite of the layering; local dev (`npm run dev` in backend/frontend with Docker Mongo) must keep working unchanged. Requirements: `api/index.js` serverless entry default-exporting the Express app; shared lazy Mongo connection (`connectOnce()` promise cache + `ensureDb` middleware returning standard JSON 503 on failure) so cold starts connect per-instance and server.js reuses it for local; Winston file transports disabled under `VERCEL` env (read-only filesystem, console only); root `package.json` npm workspaces (`backend`, `frontend`) with convenience scripts; `vercel.json` with `buildCommand`/`outputDirectory` for `frontend/dist` and rewrites: explicit `/` → `/index.html`, `/assets/*` passthrough, catch-all → `/api` (static first, everything else to Express; Vercel preserves the original path for the function so Express routes match). README deployment section: Atlas M0 setup, Vercel import, env var table, verify curls, free-model rotation note. Verify: root `npm install`, lint + 57 tests green under workspaces, and a serverless-path simulation (require api/index.js, drive it with supertest without server.js) covering /health, /monitor, /alerts, 400 shape.
- **Result summary:** Serverless sim all green (lazy connect, routes, 400 shape); workspaces install + lints + 57/57 tests pass; local dev untouched; README gained a Deployment (Vercel) section.
- **Used as-is / Modified / Rejected:** Modified — added explicit `/` and `/assets` rewrite rules after checking Vercel's rewrite order (filesystem-first is documented but explicit rules make static serving order-independent); `connectOnce` gained a `readyState === 1` guard so the integration tests' own `mongoose.connect` is not duplicated.

---

## Prompt #11
- **Date/Time:** 2026-10-23 04:55
- **AI Tool / Model:** OpenCode / opencode/mimo-v2.6-flash-free
- **Category:** Debugging
- **Related file(s):** backend/src/config/index.js, backend/src/services/providers/openaiCompat.provider.js, backend/src/services/prompts/alertPrompt.v2.js, backend/src/services/aiAlert.service.js, backend/.env.example, README.md
- **Prompt (clean version):**
> First live OpenRouter runs fail to produce `alert_source: "llm"`. Debug the raw API responses and fix end-to-end. Observed failures to diagnose and resolve: (1) configured model `minimax/minimax-m3.1-flash:free` returned 404 — free launch period ended; (2) `openrouter/free` routed to a reasoning model (`nvidia/nemotron-3.5-super-vl:free`) which consumed the entire `max_tokens: 80` budget on hidden `reasoning`, returning `content: null` → "empty LLM response"; (3) `google/gemma-4-*:free` returned upstream 429 (hot shared pool); (4) `nvidia/nemotron-3.5-lightning:free` works only with `reasoning: {enabled:false}` — otherwise reasoning burn is unpredictable (empty content at caps 300 and 500, content only at 1000); (5) raw completion contained markdown (`**Alert:**`) and extra sentences. Fixes: probe candidate free models with curl to find ones returning real content; default `LLM_MODEL=nvidia/nemotron-3.5-lightning:free`; provider always sends `reasoning: {enabled:false}` and `max_tokens` from new config `LLM_MAX_TOKENS` (default 300, no magic number); prompt bumped to `alert-prompt v2` adding strict plain-text rules (no markdown/headers/prefixes, under 40 words, ends with period) on top of v1 injection-safety; README config table documents the non-reasoning free-model requirement.
- **Result summary:** Live end-to-end now returns `alert_source: "llm"` — "AppointmentAPI is experiencing critical delays with a 5.5 second average response time and all requests returning a 500 error with zero records. This is likely caused by a database outage or severe resource exhaustion." (1.2s, prompt v2); fallback still covers retirements/429s; 57/57 tests green.
- **Used as-is / Modified / Rejected:** Modified — rejected `openrouter/free` despite retirement-proof routing (garbage "User Safety: safe" output observed with reasoning disabled); `google/gemma-4-31b-it:free` rejected after 429 upstream despite good quality.
