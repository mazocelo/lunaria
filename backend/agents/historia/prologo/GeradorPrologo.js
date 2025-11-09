import { RunnableSequence } from '@langchain/core/runnables';
import { createPrologoModel } from './model.js';
import { createPrologoPrompt } from './prompts.js';

/**
 * Cria o agente para geração de prólogo
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com métodos para gerar prólogos e histórias
 */
async function criarGeradorPrologo(temas = []) {
    try {
        const prompt = createPrologoPrompt(temas);
        const model = createPrologoModel();

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            /**
             * Gerar prólogo para um tema específico
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.tema - Tema da história
             * @returns {Object} Resultado da geração
             */
            gerarPrologo: async ({ tema }) => {
                const response = await chain.invoke({ tema });
                console.log('📖 Prólogo gerado para tema:', tema);
                return {
                    prologo: response.content,
                    tema: tema,
                    timestamp: new Date().toISOString(),
                    temasUtilizados: temas
                };
            },

            /**
             * Gerar história completa com prólogo
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.tema - Tema da história
             * @param {string} params.nome - Nome da história
             * @param {string} params.descricao - Descrição da história
             * @returns {Object} História completa gerada
             */
            criarHistoriaCompleta: async ({ tema, nome, descricao }) => {
                try {
                    const resultadoPrologo = await chain.invoke({ tema });

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
                            modelo: 'openai/gpt-oss-120b',
                            versao: '1.0',
                            temasUtilizados: temas
                        }
                    };

                    console.log('📚 História completa criada:', historiaCompleta.nome);
                    return historiaCompleta;

                } catch (error) {
                    console.error('❌ Erro ao criar história completa:', error);
                    throw error;
                }
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar gerador de prólogo:', error.message);
        throw new Error(`Erro ao criar gerador de prólogo: ${error.message}`);
    }
}

export default criarGeradorPrologo; 