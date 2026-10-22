/**
 * services/aiAlert.service.js
 * Generates human-readable alert text via the LLM provider with a deterministic fallback. Exports createAiAlertService, aiAlertService, buildFallbackMessage.
 */
const { config } = require('../config');
const { logger } = require('../utils/logger');
const { createOpenAIProvider } = require('./providers/openai.provider');
const prompts = require('./prompts/alertPrompt.v1');

/** Returns the deterministic fallback alert sentence for an anomaly, phrased like the PRD example. */
function buildFallbackMessage(anomaly) {
  const { metrics, rules_triggered: rules } = anomaly;
  const parts = [];
  if (rules.includes('FAILED_REQUEST')) {
    parts.push(`failed with status ${metrics.status_code}`);
  } else if (rules.includes('CLIENT_ERROR')) {
    parts.push(`returned status ${metrics.status_code}`);
  }
  if (rules.includes('HIGH_RESPONSE_TIME')) {
    parts.push(`was slow (${metrics.response_time_ms} ms)`);
  }
  if (metrics.records_returned === 0) {
    parts.push('returned 0 records');
  } else if (metrics.records_returned === null || metrics.records_returned === undefined) {
    parts.push('returned an unknown record count');
  }
  if (parts.length === 0) {
    parts.push(`returned status ${metrics.status_code}`);
  }
  return `${anomaly.api_name} ${parts.join(', ')}. Possible outage or data issue.`;
}

/**
 * Returns an aiAlert service: generate(anomaly) -> { message, alert_source, prompt_version }.
 * Always resolves; falls back to the template when the LLM fails, times out, or returns empty.
 */
function createAiAlertService({ provider }) {
  /** Generates alert text for one anomaly via LLM, falling back to the template. */
  async function generate(anomaly) {
    const start = Date.now();
    try {
      const text = await provider.complete({
        system: prompts.buildSystemPrompt(),
        user: prompts.buildUserPrompt(anomaly),
      });
      if (!text) throw new Error('empty LLM response');
      logger.info('llm success', {
        api_name: anomaly.api_name,
        latencyMs: Date.now() - start,
        prompt_version: prompts.version,
      });
      return { message: text, alert_source: 'llm', prompt_version: prompts.version };
    } catch (err) {
      logger.warn('llm fallback used', {
        api_name: anomaly.api_name,
        latencyMs: Date.now() - start,
        reason: err.message,
      });
      return {
        message: buildFallbackMessage(anomaly),
        alert_source: 'fallback',
        prompt_version: prompts.version,
      };
    }
  }

  return { generate };
}

const aiAlertService = createAiAlertService({
  provider: createOpenAIProvider(config.llm),
});

module.exports = { createAiAlertService, aiAlertService, buildFallbackMessage };
