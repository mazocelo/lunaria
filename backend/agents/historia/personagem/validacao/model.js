import { ChatGroq } from '@langchain/groq';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';

/**
 * Cria modelo para validação de coerência de personagem
 * @param {Object} params - Parâmetros adicionais
 * @returns {ChatGroq} Instância do modelo configurado
 */
export function createValidacaoModel(params = {}) {
    return new ChatGroq({
        apiKey: API_CONFIG.groqApiKey,
        ...DEFAULT_MODEL_SETTINGS,
        ...params,
    });
}
