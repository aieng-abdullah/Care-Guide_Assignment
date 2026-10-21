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
