/**
 * providers/openaiCompat.provider.js
 * Adapter for OpenAI-compatible chat-completions APIs (OpenRouter default, OpenAI optional) behind the LLM provider interface. Exports createOpenAICompatProvider.
 */
const OpenAI = require('openai');

/**
 * Returns a provider with a single complete({ system, user }) method.
 * Client is created lazily on first call so a missing key fails at request
 * time (caught upstream as fallback) instead of crashing module import.
 */
function createOpenAICompatProvider(llmConfig) {
  let client;

  /** Returns the memoized OpenAI client; created on first call so import never needs credentials. */
  function getClient() {
    if (!client) {
      client = new OpenAI({
        apiKey: llmConfig.apiKey || 'not-configured',
        baseURL: llmConfig.baseUrl,
        timeout: llmConfig.timeoutMs,
        maxRetries: 2,
      });
    }
    return client;
  }

  /** Sends one chat completion request and returns the trimmed assistant text. */
  async function complete({ system, user }) {
    const response = await getClient().chat.completions.create({
      model: llmConfig.model,
      temperature: 0.3,
      max_tokens: llmConfig.maxTokens || 300,
      reasoning: { enabled: false },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || '';
  }

  return { complete };
}

module.exports = { createOpenAICompatProvider };
