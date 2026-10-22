/**
 * services/providers/openai.provider.js
 * OpenAI chat-completions adapter behind the LLM provider interface. Exports createOpenAIProvider.
 */
const OpenAI = require('openai');

/**
 * Returns a provider with a single complete({ system, user }) method.
 * Timeout and retries come from the OpenAI client options.
 */
function createOpenAIProvider(llmConfig) {
  const client = new OpenAI({
    apiKey: llmConfig.apiKey,
    timeout: llmConfig.timeoutMs,
    maxRetries: 2,
  });

  /** Sends one chat completion request and returns the trimmed assistant text. */
  async function complete({ system, user }) {
    const response = await client.chat.completions.create({
      model: llmConfig.model,
      temperature: 0.3,
      max_tokens: 80,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || '';
  }

  return { complete };
}

module.exports = { createOpenAIProvider };
