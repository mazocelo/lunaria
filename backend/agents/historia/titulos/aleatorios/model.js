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
 * Cria um modelo otimizado para geração de títulos
 * @returns {ChatGroq} Modelo configurado para títulos
 */
export function createTituloModel() {
    return generateModel({ 
        temperature: 0.9, // Mais criativo para títulos
        maxTokens: 2000 
    });
}

/**
 * Cria um modelo para geração de títulos com alta criatividade
 * @returns {ChatGroq} Modelo configurado para títulos muito criativos
 */
export function createTituloCriativoModel() {
    return generateModel({ 
        temperature: 1.0, // Máxima criatividade
        maxTokens: 2000 
    });
} 