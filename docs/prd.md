# PRD: Intelligent API Monitoring & Alert System

| | |
|---|---|
| **Document type** | Product Requirements Document |
| **Project** | Technical Interview Task (AI Automation) |
| **Status** | Draft v1.0 |
| **Deadline** | 5 days from assignment date |

---

## 1. Overview

The company integrates with multiple external APIs for patient and operational data. These APIs can fail intermittently, return inconsistent data, or produce abnormal responses. This system proactively monitors API responses, detects anomalies, stores them, and uses an LLM to generate clear, human-readable alerts that operators can act on.

## 2. Goals and Non-Goals

### Goals
- Automatically evaluate API health from submitted response data.
- Detect anomalies: high response time, failed requests, missing or zero records.
- Generate AI-powered, human-readable alerts.
- Persist anomalies and expose them via a REST API and a clean UI.
- Handle batches of many API inputs reliably.

### Non-Goals
- Actively polling or calling the external APIs ourselves (input is supplied via JSON or `POST /monitor`).
- User authentication and role management.
- Production-grade deployment, autoscaling, or multi-tenant support.

## 3. Users

| User | Need |
|---|---|
| Operations / support engineer | See what is broken right now, in plain language |
| Developer / integrator | Understand the likely cause and which API is affected |
| Interview reviewer | Evaluate architecture, code quality, AI usage, and scalability |

## 4. Scope and Input Methods

The system accepts input in two ways:

1. **Static JSON file** containing API responses (CLI or startup loader).
2. **`POST /monitor`** on the Node.js backend.

### Input schema

```json
[
  {
    "api_name": "PatientDataAPI",
    "response_time_ms": 1200,
    "status_code": 200,
    "records_returned": 50
  },
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  }
]
```

| Field | Type | Rules |
|---|---|---|
| `api_name` | string | Required, 1-100 chars, `[A-Za-z0-9_\- ]` only |
| `response_time_ms` | number | Required, integer >= 0 |
| `status_code` | number | Required, integer 100-599 |
| `records_returned` | number | Required, integer >= 0 (missing or null is itself an anomaly) |

## 5. Functional Requirements

### FR-1 API Health Monitoring
- **FR-1.1** Evaluate response time against a configurable threshold.
- **FR-1.2** Check HTTP status codes.
- **FR-1.3** Validate returned data (record count present and non-negative).

### FR-2 Anomaly Detection

| Rule ID | Condition | Default | Severity |
|---|---|---|---|
| `HIGH_RESPONSE_TIME` | `response_time_ms` > threshold | 3000 ms warning, 5000 ms critical | warning / critical |
| `FAILED_REQUEST` | `status_code` >= 500 | n/a | critical |
| `CLIENT_ERROR` | `status_code` 400-499 | n/a | warning |
| `ZERO_RECORDS` | `records_returned` == 0 on a 2xx response | n/a | warning |
| `MISSING_DATA` | `records_returned` missing or null | n/a | warning |

- Thresholds are set in environment config, not hardcoded.
- One response can trigger multiple rules. These are combined into **one alert per API per run** with all triggered rules listed.
- A healthy response produces no anomaly.

### FR-3 AI-Powered Alert Generation
- **FR-3.1** Send the structured anomaly (rules, metrics, severity) to an LLM API (Gemini or OpenAI) to produce a short human-readable alert.
- **FR-3.2** Prompt must produce 1-2 sentences, name the API, state the metrics, and suggest a likely cause (e.g. "Possible outage or data issue.").
- **FR-3.3** Example output: *"AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue."*
- **FR-3.4** If the LLM call fails or times out, fall back to a deterministic template message so alerts are never lost. Mark `alert_source: "fallback"`.
- **FR-3.5** Treat all input values as untrusted data, never as instructions to the LLM (prompt injection safe).

### FR-4 Data Storage
- Store anomalies in MongoDB (Mongoose), or SQL if preferred.

| Field | Description |
|---|---|
| `_id` | Unique ID |
| `api_name` | Affected API |
| `rules_triggered` | Array of rule IDs |
| `severity` | `warning` or `critical` |
| `metrics` | `response_time_ms`, `status_code`, `records_returned` |
| `message` | AI-generated alert text |
| `alert_source` | `llm` or `fallback` |
| `status` | `active` or `resolved` |
| `created_at`, `resolved_at` | Timestamps |

- Index on `status`, `api_name`, `created_at`.
- Avoid duplicates: do not create a new active alert for the same `api_name` and same rule set if one is already active. Update `last_seen` and `occurrences` instead.

### FR-5 REST API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/monitor` | Accept a batch of API responses, run detection, store alerts, return summary |
| `GET` | `/alerts` | Fetch all **active** anomalies (supports `?severity=` and `?api_name=`) |
| `PATCH` | `/alerts/:id/resolve` | Mark an alert as resolved |
| `GET` | `/health` | Service health check |

`POST /monitor` response example:

```json
{
  "processed": 2,
  "healthy": 1,
  "anomalies": 1,
  "failed": 0,
  "alerts": [{ "api_name": "AppointmentAPI", "severity": "critical" }]
}
```

### FR-6 Frontend
- Clean, responsive dashboard listing active alerts.
- Each alert card shows: API name, severity badge, AI message, metrics, rules triggered, time.
- Filter by severity and API name; auto-refresh or manual refresh.
- Summary counters (total, critical, warning).
- Resolve button per alert.
- Form or textarea to paste JSON and submit to `/monitor`.
- Loading, empty, and error states.

### FR-7 Batch Processing
- Process many API inputs in one request.
- A failure on one item must not stop the rest (per-item error isolation).
- LLM calls run with a concurrency limit (e.g. 5) to respect rate limits.

### FR-8 Error Handling and Logging
- Centralized Express error middleware with consistent JSON error shape.
- Input validation (Zod or Joi) returning `400` with field-level details.
- Structured logging (Winston or Pino) with levels, to console and file.
- Log each request, each detection result, each LLM call outcome, and every error.

### FR-9 Optional: Email Reports
- Send an anomaly report by email (Nodemailer) when new critical alerts are created.
- Feature flag: `EMAIL_ENABLED=true`. Failure to send must never break `/monitor`.

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Architecture | Modular layers: routes, controllers, services, models, utils |
| Scalability | Stateless server, batch processing, concurrency-limited LLM calls, DB indexes |
| Reliability | LLM fallback, per-item isolation, request timeouts and retries |
| Security | Secrets in `.env`, input validation, rate limiting, no secrets in logs or repo |
| Performance | `GET /alerts` under 300 ms for 10k alerts; `/monitor` handles 100 items per request |
| Maintainability | ESLint, consistent naming, JSDoc on services, unit tests for detection rules |

## 7. Architecture

```
JSON file / POST /monitor
        |
   Validation (Zod/Joi)
        |
   Health Monitor Service  -->  Anomaly Detector (rules)
        |
   AI Alert Service (LLM, with fallback)
        |
   Alert Repository (MongoDB)  -->  Email Service (optional)
        |
   GET /alerts  -->  Frontend Dashboard
```

### Suggested project structure

```
project/
  backend/
    src/
      config/        # env, db, thresholds
      routes/
      controllers/
      services/      # monitor, detector, aiAlert, email
      models/
      middleware/    # validation, errorHandler, rateLimit
      utils/         # logger, concurrency helper
      app.js
      server.js
    data/sample-input.json
    tests/
  frontend/
  docs/
    AI_Prompts.md    # working prompt log (see AGENT.md)
  AI_Prompts.docx    # final submission file
  README.md
  PRD.md
  AGENT.md
```

### Tech stack
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **LLM:** Gemini or OpenAI via official SDK
- **Frontend:** React (Vite) or plain HTML/CSS/JS
- **Logging:** Winston or Pino
- **Email (optional):** Nodemailer
- **Tests:** Jest and Supertest

## 8. AI Usage and Prompt Documentation (Mandatory)

The assignment requires that if AI is used for **code generation, prompt design, or logic building**, every prompt must be documented and submitted as a separate file.

- Every prompt sent to any AI tool during this project is logged in `docs/AI_Prompts.md` as it happens.
- Prompts used **inside the product** (the alert-generation prompt sent to the LLM API) are logged too, with the final version stored in `backend/src/services/prompts/`.
- Before submission, the log is exported to **`AI_Prompts.docx`**.
- `AI_Prompts.docx` is **not** placed in the code repo's required files. It is submitted separately with the video via the Cloud/Drive link.
- Full logging rules are in `AGENT.md`.

## 9. Deliverables

| # | Deliverable | Where |
|---|---|---|
| 1 | Full source code | GitHub repository |
| 2 | README (setup and run instructions) | Repo root |
| 3 | Video explanation, 5-10 min (architecture, workflow, key decisions) | Cloud/Drive link |
| 4 | `AI_Prompts.docx` (all prompts used) | Cloud/Drive link |
| 5 | Submission email with GitHub link and Drive link | Email |

## 10. Acceptance Criteria

- [ ] `POST /monitor` accepts the example payload and returns a correct summary.
- [ ] The 500-status, 0-records example produces a **critical** alert with an AI-written message.
- [ ] The healthy example produces no alert.
- [ ] High response time, 5xx, 4xx, zero records, and missing records are each detected.
- [ ] Anomalies are persisted and survive a server restart.
- [ ] `GET /alerts` returns only active anomalies.
- [ ] LLM outage still produces an alert using the fallback template.
- [ ] A batch with one invalid item still processes the valid items.
- [ ] Frontend displays, filters, and resolves alerts.
- [ ] Errors are logged to file; invalid input returns `400`.
- [ ] README lets a new developer run the project in under 10 minutes.
- [ ] `AI_Prompts.docx` contains every AI prompt used.

## 11. Evaluation Mapping

| Criterion | How this PRD addresses it |
|---|---|
| Backend and API design | Layered architecture, FR-5, FR-8 |
| Frontend | FR-6 |
| AI usage | FR-3 prompt design, fallback, injection safety |
| Data handling | FR-4 schema, indexes, deduplication |
| Automation logic | FR-2 rule table |
| Scalability | FR-7, non-functional requirements |

## 12. Timeline (5 days)

| Day | Work |
|---|---|
| 1 | Project setup, config, DB, validation, logger |
| 2 | Detection rules and `/monitor` with unit tests |
| 3 | LLM integration, fallback, storage, `/alerts` |
| 4 | Frontend dashboard, optional email |
| 5 | README, testing, video recording, finalize `AI_Prompts.docx`, submit |

## 13. Risks

| Risk | Mitigation |
|---|---|
| LLM rate limits or downtime | Fallback template, concurrency limit, retries with backoff |
| LLM cost or latency on large batches | Concurrency limit, short prompts, `max_tokens` cap |
| Prompt injection via `api_name` | Strict validation, treat inputs as data in a delimited block |
| Forgetting to log prompts | Mandatory rules in `AGENT.md`, checklist before submission |
| Running out of time | Optional email is last priority |