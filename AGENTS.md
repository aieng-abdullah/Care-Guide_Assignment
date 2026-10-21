# AGENTS.md

Instructions for any AI coding assistant working on this repository. Read this file fully before doing anything. Requirements are in `docs/prd.md` (the PRD; it refers to this file as `AGENT.md`).

## 1. Project Summary

**Intelligent API Monitoring & Alert System**: Node.js (Express) backend accepts API response data via `POST /monitor`, detects anomalies, generates human-readable alerts with an LLM, stores them in MongoDB, exposes them at `GET /alerts`, and shows them in a frontend dashboard.

## 2. MANDATORY: Prompt Logging

Interview submission rule: **log only prompts needed for building the project** and submit them in `AI_Prompts.docx`. Not optional; takes priority over speed.

### 2.1 What counts as building the project (log these)
- Prompts that produce or change **product code** (backend, frontend, tests, config logic)
- Logic and architecture decisions (detection rules, LLM integration, data model, batch handling)
- Debugging that changes behavior or fixes a real bug
- Refactoring/review requests that alter code structure or quality
- Prompt-design requests and **every version of the runtime alert prompt** (system + user prompt sent to the LLM API)

**Skip** (do not log): small talk, clarifying questions with no output change, status checks, routine steps, git/PR/commit/file operations, trivial typo/format edits, requests that only restate an already-logged prompt.

### 2.2 Where
- Working log: `docs/AI_Prompts.md` (append-only)
- Submission file: `AI_Prompts.docx` (generated from the log, never committed)

### 2.3 When
Append **immediately after each qualifying interaction**, same session. Never batch or reconstruct from memory. Before finishing a qualifying task, confirm the entry exists; add it first if missing.

### 2.4 Entry format

```markdown
## Prompt #<number>
- **Date/Time:** YYYY-MM-DD HH:MM
- **AI Tool / Model:** e.g. Claude, ChatGPT-4o, Gemini
- **Category:** Code generation | Debugging | Logic | Prompt design | Docs | Testing | Refactor
- **Related file(s):** e.g. backend/src/services/detector.js
- **Prompt (clean version):**
> <goal, context, constraints, expected output>
- **Result summary:** 1-2 lines on what the AI produced
- **Used as-is / Modified / Rejected:** and why
```

### 2.5 Rules
1. Clean rewrite, not raw chat paste: fix grammar, remove filler, organize as goal/context/constraints/expected output. Large code/logs summarized or referenced by file name.
2. No omissions of **project-building prompts** (section 2.1) — unlogged AI-assisted code violates the assignment. Small talk, steps, and routine interactions stay unlogged by design.
3. Faithful: keep real intent; never invent entries or add unrequested requirements.
4. Sequential numbering; never renumber or delete past entries; corrections go in a new entry or note.
5. Redact secrets as `[REDACTED]`; never paste `.env`.
6. Runtime prompt changes get version labels (`alert-prompt v1`, `v2`, ...) plus a short reason.
7. AI-written code must be traceable to a logged prompt.

### 2.6 Export to `AI_Prompts.docx`
```bash
pandoc docs/AI_Prompts.md -o AI_Prompts.docx
```
If pandoc missing, use a docx library or Word. Start with a header: project name, developer name, date, total prompt count. Preserve all entries in order. Do this as the **last step before submission** and open the file to verify completeness.

### 2.7 Submission
`AI_Prompts.docx` goes in the Drive link with the video, **separately** from the repo. If AI was used, the file is required; if genuinely not used, state that in the email instead of omitting it.

### 2.8 Starter template for `docs/AI_Prompts.md`

```markdown
# AI Prompts Log
**Project:** Intelligent API Monitoring & Alert System
**Developer:** <name>

---

## Prompt #1
- **Date/Time:**
- **AI Tool / Model:**
- **Category:**
- **Related file(s):**
- **Prompt (clean version):**
> 
- **Result summary:**
- **Used as-is / Modified / Rejected:**
```

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| Database | MongoDB with Mongoose |
| LLM | Gemini or OpenAI official SDK |
| Validation | Zod or Joi |
| Logging | Winston or Pino |
| Email (optional) | Nodemailer |
| Frontend | React (Vite) or plain HTML/CSS/JS |
| Tests | Jest and Supertest |

No new dependencies without a clear reason. Prefer the standard library and this stack.

## 4. Architecture Rules

Strict layers: `routes -> controllers -> services -> models`

- **Routes:** URL mapping only.
- **Controllers:** parse request, call services, shape response. No business logic.
- **Services:** all business logic (`monitor`, `detector`, `aiAlert`, `email`).
- **Models:** Mongoose schemas and DB access only.
- **Middleware:** validation, error handler, rate limiting.
- **Config:** thresholds, model names, flags come from `config/` and `.env`. No magic numbers.
- Detection rules must be **pure functions** (input in, anomalies out) for unit testing.

## 5. Coding Standards

- `async/await`, never nested callbacks.
- Never swallow errors: log and propagate to error middleware.
- JSON error shape everywhere: `{ "error": { "code": "...", "message": "...", "details": [] } }`.
- Clear names (`detectAnomalies`, `generateAlertMessage`), small single-purpose functions.
- Run ESLint before considering a task done.
- No `console.log` in app code — use the logger.

### 5.1 Docstrings

Every source file starts with a 1-3 line header comment saying what the file is for and what it exports:

```js
/**
 * detector.service.js
 * Pure anomaly-detection rules for API responses. Exports detectAnomalies().
 */
```

Every class and function gets a **single-line** `/** ... */` docstring starting with a verb ("Returns", "Validates"). No multi-paragraph docs.

- Applies to all backend and frontend files (services, controllers, models, middleware, utils, React components, hooks).
- `@param`/`@returns` only when types are not obvious.
- Small private helpers need a one-liner too if the name alone is unclear.
- Comments explain **why**, never narrate what the code says.
- Keep docstrings accurate as code changes; no commented-out code or stale TODOs.

### 5.2 Production Code Standards

**Modularity**
- One responsibility per file/function; files under ~200 lines, functions under ~30 lines.
- No circular dependencies; flow is routes -> controllers -> services -> models.
- Pass dependencies in (config, logger, LLM client, repository) instead of importing globals deep inside logic.
- LLM provider behind an interface (`aiAlert.service` + provider adapter) so Gemini/OpenAI swap without touching other code.
- Detection rules in a registry of small rule functions — a new rule is one new file/entry, no edits to existing logic.
- Reuse helpers from `utils/`; never copy-paste (DRY).

**Scalability**
- Stateless server; all state in the database. No request/alert state in memory.
- Bounded concurrency for batches (e.g. `p-limit`); never unbounded parallel LLM calls.
- Pagination on list endpoints (`GET /alerts?page=&limit=`); never unbounded result sets.
- DB indexes on every query filter/sort field (`status`, `api_name`, `created_at`).
- `.lean()` and field projection on read-heavy Mongoose queries.
- Timeouts, retries with backoff, circuit-breaker/fallback on all external calls (LLM, email).
- Slow optional work (email, LLM enrichment) off the critical path; structure so a queue (BullMQ) can be added later without a rewrite.
- Thresholds, concurrency, timeouts, model names adjustable by env var with no code change.

**Reliability**
- Validate at the boundary; trust validated data inside.
- Fail fast on bad config at startup (check required env vars).
- Graceful shutdown on `SIGTERM` (close DB connections and server).
- Naming: `camelCase` variables/functions, `PascalCase` classes, `camelCase.suffix.js` or `kebab-case` files, `UPPER_SNAKE_CASE` constants.
- Small composable pure functions; no side effects outside services and models.
- No dead code, unused imports, magic numbers/strings.

**Definition of done for any code change**
- [ ] File header present on every new/edited file
- [ ] One-line docstring on every class and function
- [ ] Single responsibility, clear dependencies
- [ ] No unbounded loops, queries, or concurrency
- [ ] Lint and tests pass

## 6. Behavior Rules for the Product

**Anomaly detection**
- Implement PRD FR-2 rules exactly; thresholds configurable.
- One alert per API per run, combining all triggered rules.
- No duplicate active alerts for the same `api_name` + rule set — increment `occurrences`, update `last_seen`.

**LLM usage**
- Alert prompt short, structurally deterministic, 1-2 sentences.
- Low temperature (0.2-0.4), `max_tokens` cap, request timeout.
- **Always a fallback template** when the LLM fails, times out, or returns empty.
- **Prompt injection safety:** API data in a clearly delimited data block, told it is data not instructions; validate `api_name` to `[A-Za-z0-9_\- ]` before it reaches the prompt.
- Never log API keys; log LLM latency and outcome (success/fallback).

**Batch processing**
- Per-item failure isolation via `Promise.allSettled` or equivalent.
- LLM concurrency limit (default 5).

## 7. Security Rules

- All secrets in `.env`; commit `.env.example` with placeholders only.
- `.env` and logs in `.gitignore`.
- Validate all input; reject unknown/malformed fields with `400`.
- `helmet`, CORS config, rate limiting on `/monitor`.
- Never real patient data in code, tests, samples, or logs — synthetic data only.

## 8. Testing Rules

- Unit tests for every detection rule, including edges: exactly at threshold, null records, 4xx vs 5xx.
- Integration tests for `POST /monitor` and `GET /alerts` (mock the LLM).
- Test proving fallback message used when LLM fails.
- Test proving a bad batch item does not block the others.

## 9. Workflow for the Assistant

1. Read `docs/prd.md` and this file.
2. Confirm what is asked and which files are affected.
3. Implement following sections 4-8.
4. Run lint and tests.
5. **Append the prompt entry to `docs/AI_Prompts.md`** if the task qualifies under section 2.1.
6. Summarize changes and assumptions.

Do not mark a task complete until step 5 is done.

## 10. Git Hygiene

Reviewer reads the commit history — keep it clean.

### 10.1 Branching
- `main` always working and runnable; never commit broken code to it.
- Short-lived branches: `type/short-description` (`feat/anomaly-detector`, `fix/batch-error-isolation`, `docs/readme-setup`, `test/detector-edge-cases`, `chore/eslint-config`).
- Merge to `main` only after lint and tests pass; delete merged branches.

### 10.2 Commits
- Conventional Commits: `type(scope): summary`. Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`, `perf`.
- Imperative mood, lowercase, no trailing period, ≤72 chars; body when the "why" is not obvious.
- One logical change per commit; small and often. Never `fix`, `update`, `changes`, `wip`, `final`.
- No commented-out code, debug logs, or TODO dumps in commits.

### 10.3 Prompt log and commits
- Commit `docs/AI_Prompts.md` in the **same commit/branch** as the change it produced.
- Never rewrite history to hide/remove prompt entries.
- Never commit `AI_Prompts.docx` — keep it in `.gitignore` or outside the repo.

### 10.4 Never commit
`.env` or real keys/tokens/passwords/connection strings; `node_modules/`, `dist/`, `build/`, `coverage/`; logs (`*.log`, `logs/`); OS/editor files (`.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`); real patient data or DB dumps.

Required `.gitignore` baseline:

```gitignore
node_modules/
.env
.env.*
!.env.example
logs/
*.log
dist/
build/
coverage/
.DS_Store
Thumbs.db
.vscode/
.idea/
AI_Prompts.docx
```

### 10.5 Secret leak protocol
1. Revoke and rotate the key immediately — rotation is the real fix.
2. Remove from history (`git filter-repo` or BFG) before pushing or sharing.
3. Never rely on a follow-up "remove secret" commit; the key stays in history.

### 10.6 Before every commit and push
- `git status` + `git diff --staged`, review exactly what is going in.
- Stage deliberately (`git add <files>`, `git add -p`); no blind `git add .`.
- Run lint and tests.
- No force-push to `main`; no history rewrites.
- No unrelated files or reformatting of untouched code.

### 10.7 Repository must-haves
`README.md` (setup/run), `.env.example`, `.gitignore` as above, `docs/prd.md`, this file, `docs/AI_Prompts.md`. Recommended: `LICENSE`, folder structure matching the PRD.

### 10.8 Assistant behavior with git
- May suggest commit messages and branch names in the format above.
- Must not run destructive commands (`git push --force`, `git reset --hard`, `git clean -fd`, history rewrites) without explicit developer confirmation.
- Must check no secrets or ignored files are staged before suggesting a commit.

## 11. Pre-Submission Checklist

- [ ] All PRD acceptance criteria pass
- [ ] README with setup and run instructions
- [ ] `.env.example` present; no secrets committed
- [ ] `.gitignore` in place; `git status` clean; no `node_modules`, logs, `.env` tracked
- [ ] Clean commit history: Conventional Commits, small logical commits
- [ ] Secret scan clean: `git log -p | grep -iE "api[_-]?key|secret|token"`
- [ ] Repo accessible to the reviewer
- [ ] Lint and tests pass
- [ ] File headers + one-line docstrings everywhere
- [ ] `docs/AI_Prompts.md` complete (project-building prompts only), numbered, no secrets
- [ ] Runtime alert prompt versions logged
- [ ] **`AI_Prompts.docx` generated, opened, verified complete**
- [ ] 5-10 minute video recorded (architecture, workflow, key decisions)
- [ ] GitHub link + Drive link (video + docx) ready; submission email sent

## 12. Things the Assistant Must Never Do

- Skip or delay prompt logging for **project-building prompts**; edit, reword, or delete logged prompts; invent or fake entries.
- Commit secrets or real patient data.
- Hardcode thresholds, keys, or model names.
- Ship a file without a header, or a class/function without a one-line docstring.
- Write monolithic files/functions mixing responsibilities.
- Add out-of-scope features without asking (see non-goals in the PRD).
- Use vague commit messages (`fix`, `final`) or commit `.env`, logs, `node_modules`.
- Run destructive git commands without explicit confirmation.
