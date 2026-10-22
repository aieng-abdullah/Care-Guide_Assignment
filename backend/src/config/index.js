/**
 * config/index.js
 * Loads and validates environment variables at startup; exports frozen config. Fails fast on missing required vars.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const REQUIRED = ['MONGO_URI'];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

/** Returns a positive integer from env, or the default. */
function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer, got "${raw}"`);
  }
  return value;
}

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: intFromEnv('PORT', 3000),
  logLevel: process.env.LOG_LEVEL || 'info',
  mongoUri: process.env.MONGO_URI,
  llm: Object.freeze({
    provider: process.env.LLM_PROVIDER || 'openrouter',
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.LLM_MODEL || 'nvidia/nemotron-3.5-lightning:free',
    timeoutMs: intFromEnv('LLM_TIMEOUT_MS', 5000),
    maxTokens: intFromEnv('LLM_MAX_TOKENS', 300),
    concurrency: intFromEnv('LLM_CONCURRENCY', 5),
  }),
  cors: Object.freeze({
    origin: process.env.CORS_ORIGIN || '*',
  }),
  rateLimit: Object.freeze({
    windowMs: intFromEnv('RATE_LIMIT_WINDOW_MS', 60000),
    max: intFromEnv('RATE_LIMIT_MAX', 100),
  }),
  email: Object.freeze({
    enabled: process.env.EMAIL_ENABLED === 'true',
  }),
});

module.exports = { config };
