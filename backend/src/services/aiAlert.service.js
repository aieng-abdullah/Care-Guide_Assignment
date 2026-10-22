/**
 * services/aiAlert.service.js
 * Generates human-readable alert text via the LLM provider with a deterministic fallback. Exports createAiAlertService, aiAlertService, buildFallbackMessage.
 */
const { config } = require('../config');
const { logger } = require('../utils/logger');
const { createOpenAIProvider } = require('./providers/openai.provider');
const prompts = require('./prompts/alertPrompt.v1');

/** Returns the deterministic fallback alert sentence for an anomaly. */
function buildFallbackMessage(anomaly) {
  const records =
    anomaly.metrics.records_returned === null
      ? 'records missing'
      : `${anomaly.metrics.records_returned} records`;
  return (
    `${anomaly.api_name} triggered ${anomaly.rules_triggered.join(', ')} ` +
    `(severity: ${anomaly.severity}) — status ${anomaly.metrics.status_code}, ` +
    `${anomaly.metrics.response_time_ms} ms, ${records}. Possible outage or data issue.`
  );
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
