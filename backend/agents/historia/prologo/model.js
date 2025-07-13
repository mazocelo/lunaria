import { ChatGroq } from '@langchain/groq';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';

/**
 * Gera o modelo da Groq com configurações personalizadas
 * @param {Object} detalhes - Configurações adicionais para o modelo
 * @returns {ChatGroq} Instância do modelo configurado
 */
export function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: API_CONFIG.groqApiKey,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}

/**
 * Cria um modelo otimizado para geração de prólogos
 * @returns {ChatGroq} Modelo configurado para prólogos
 */
export function createPrologoModel() {
    return generateModel({ 
        temperature: 0.8, // Mais criativo para prólogos
        maxTokens: 8000 
    });
}

/**
 * Cria um modelo para geração de histórias completas
 * @returns {ChatGroq} Modelo configurado para histórias
 */
export function createHistoriaModel() {
    return generateModel({ 
        temperature: 0.7, // Equilibrado para histórias
        maxTokens: 12000 
    });
} 