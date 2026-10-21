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
