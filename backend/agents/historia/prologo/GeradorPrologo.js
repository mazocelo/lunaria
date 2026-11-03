import { RunnableSequence } from '@langchain/core/runnables';
import { createPrologoModel } from './model.js';
import { createPrologoPrompt } from './prompts.js';
import { DEFAULT_MODEL_SETTINGS } from './config.js';
import { trackLLMUsage } from '../../../services/llmTracker.js';
import logger from '../../../helpers/logger.js';

const log = logger.child({ module: 'GeradorPrologo' });

/**
 * Cria o agente para geração de prólogo
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com métodos para gerar prólogos e histórias
 */
async function criarGeradorPrologo(temas = []) {
    try {
        const prompt = createPrologoPrompt(temas);
        const model = createPrologoModel();
        const modelName = DEFAULT_MODEL_SETTINGS.model;

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            gerarPrologo: async ({ temas: temasInput, descricao = '', userId }) => {
                const startTime = Date.now();
                const response = await chain.invoke({
                    tema: temasInput,
                    descricao: descricao || 'Nenhuma descrição fornecida — crie livremente baseado nos temas.',
                });
                trackLLMUsage(response, { modelName, userId, startTime, agent: 'GeradorPrologo' });
                log.info({ temas: temasInput }, 'Prologo gerado');
                return {
                    prologo: response.content,
                    tema: temasInput,
                    timestamp: new Date().toISOString(),
                    temasUtilizados: temas
                };
            },

            criarHistoriaCompleta: async ({ tema, nome, descricao, userId }) => {
                try {
                    const startTime = Date.now();
                    const resultadoPrologo = await chain.invoke({ tema });
                    trackLLMUsage(resultadoPrologo, { modelName, userId, startTime, agent: 'GeradorPrologo' });

                    const historiaCompleta = {
                        nome: nome || `Aventura em ${tema}`,
                        tema: tema,
                        descricao: descricao || '',
                        prologo: resultadoPrologo.content,
                        elementos: {
                            cenaInicial: 'Baseada no prólogo gerado',
                            npcsSugeridos: [],
                            locaisSugeridos: [],
                            conflitosSugeridos: []
                        },
                        metadata: {
                            geradoEm: new Date().toISOString(),
                            modelo: modelName,
                            versao: '1.0',
                            temasUtilizados: temas
                        }
                    };

                    log.info({ nome: historiaCompleta.nome }, 'Historia completa criada');
                    return historiaCompleta;

                } catch (error) {
                    log.error({ err: error }, 'Erro ao criar historia completa');
                    throw error;
                }
            }
        };
    } catch (error) {
        log.error({ err: error }, 'Erro ao criar gerador de prologo');
        throw new Error(`Erro ao criar gerador de prólogo: ${error.message}`);
    }
}

export default criarGeradorPrologo;
