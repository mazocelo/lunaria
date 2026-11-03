import { RunnableSequence } from '@langchain/core/runnables';
import { createValidacaoModel } from './model.js';
import { createValidacaoPrompt } from './prompts.js';
import { DEFAULT_MODEL_SETTINGS } from './config.js';
import { trackLLMUsage } from '../../../../services/llmTracker.js';
import logger from '../../../../helpers/logger.js';

const log = logger.child({ module: 'ValidadorPersonagem' });

/**
 * Cria o agente para validação de coerência de personagens
 * @returns {Object} Objeto com método para validar personagem
 */
async function criarValidadorPersonagem() {
    try {
        const prompt = createValidacaoPrompt();
        const model = createValidacaoModel();
        const modelName = DEFAULT_MODEL_SETTINGS.model;

        const chain = RunnableSequence.from([prompt, model]);

        return {
            validar: async ({
                nome, classe, raca, nivel = 1,
                forca = 10, inteligencia = 10, carisma = 10,
                destreza = 10, constituicao = 10, agilidade = 10,
                vantagens = '', desvantagens = '', equipamentos = '',
                background = '',
                userId
            }) => {
                try {
                    const startTime = Date.now();
                    const response = await chain.invoke({
                        nome, classe, raca,
                        nivel: String(nivel),
                        forca: String(forca),
                        inteligencia: String(inteligencia),
                        carisma: String(carisma),
                        destreza: String(destreza),
                        constituicao: String(constituicao),
                        agilidade: String(agilidade),
                        vantagens, desvantagens, equipamentos,
                        background: background || 'Ainda não definido'
                    });
                    trackLLMUsage(response, { modelName, userId, startTime, agent: 'ValidadorPersonagem' });

                    const content = response.content.trim();
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        log.warn({ content }, 'Resposta da IA nao e JSON valido');
                        return { valido: true, avisos: [], sugestoes: [] };
                    }

                    const resultado = JSON.parse(jsonMatch[0]);
                    log.info({ nome }, 'Validacao de coerencia concluida');

                    return {
                        valido: resultado.valido !== false,
                        avisos: Array.isArray(resultado.avisos) ? resultado.avisos.slice(0, 3) : [],
                        sugestoes: Array.isArray(resultado.sugestoes) ? resultado.sugestoes.slice(0, 3) : []
                    };
                } catch (error) {
                    log.error({ err: error }, 'Erro ao validar personagem');
                    return { valido: true, avisos: [], sugestoes: ['Não foi possível validar coerência no momento.'] };
                }
            }
        };
    } catch (error) {
        log.error({ err: error }, 'Erro ao criar validador de personagem');
        throw new Error(`Erro ao criar validador de personagem: ${error.message}`);
    }
}

export default criarValidadorPersonagem;
