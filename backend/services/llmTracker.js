import usageService from './usageService.js';

/**
 * Detecta o provider a partir do nome do modelo
 */
function detectProvider(modelName) {
  if (!modelName) return 'groq';
  const m = modelName.toLowerCase();
  if (m.startsWith('gemini')) return 'gemini';
  if (m.startsWith('claude')) return 'anthropic';
  return 'groq';
}

/**
 * Extrai tokens de uma resposta LangChain e registra no usageService.
 * Compatível com Groq, Gemini e Anthropic.
 *
 * @param {Object} response - Resposta crua do LangChain (AIMessage)
 * @param {Object} options
 * @param {string} options.modelName - Nome do modelo usado
 * @param {string} options.userId - ID do usuário
 * @param {number} [options.startTime] - Date.now() antes da chamada (para duracao_ms)
 * @param {string} [options.agent] - Nome do agente (metadata)
 */
export function trackLLMUsage(response, { modelName, userId, startTime, agent }) {
  if (!userId) return;
  try {
    // Groq: response.response_metadata.token_usage.{prompt_tokens, completion_tokens}
    // Gemini: response.usage_metadata.{input_tokens, output_tokens}
    // Anthropic: response.response_metadata.usage.{input_tokens, output_tokens}
    const tokenUsage =
      response?.response_metadata?.token_usage ||
      response?.response_metadata?.usage ||
      response?.usage_metadata ||
      {};

    const input_tokens = tokenUsage.prompt_tokens || tokenUsage.input_tokens || 0;
    const output_tokens = tokenUsage.completion_tokens || tokenUsage.output_tokens || 0;
    const provider = detectProvider(modelName);

    usageService.track({
      userId,
      provider,
      tipo: 'text',
      modelo: modelName,
      input_tokens,
      output_tokens,
      duracao_ms: startTime ? Date.now() - startTime : null,
      metadata: agent ? { agent } : undefined,
    });
  } catch (e) {
    // silent — never break app flow for tracking
  }
}

export default trackLLMUsage;
