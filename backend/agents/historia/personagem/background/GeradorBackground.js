import { RunnableSequence } from '@langchain/core/runnables';
import { createBackgroundModel, createBackgroundDetalhadoModel } from './model.js';
import { createBackgroundPrompt, createBackgroundClassePrompt } from './prompts.js';

/**
 * Cria o agente para geração de background de personagens
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com métodos para gerar backgrounds
 */
async function criarGeradorBackground(temas = []) {
    try {
        const prompt = createBackgroundPrompt(temas);
        const model = createBackgroundModel();

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            /**
             * Gerar background para um personagem
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.nome - Nome do personagem
             * @param {string} params.classe - Classe do personagem
             * @param {string} params.tema - Tema da história
             * @returns {Object} Resultado da geração
             */
            gerarBackground: async ({ nome, classe, tema }) => {
                const response = await chain.invoke({ nome, classe, tema });
                console.log('👤 Background gerado para personagem:', nome);
                return {
                    background: response.content.trim(),
                    nome: nome,
                    classe: classe,
                    tema: tema,
                    timestamp: new Date().toISOString(),
                    temasUtilizados: temas
                };
            },

            /**
             * Gerar background detalhado para um personagem
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.nome - Nome do personagem
             * @param {string} params.classe - Classe do personagem
             * @param {string} params.tema - Tema da história
             * @returns {Object} Resultado da geração
             */
            gerarBackgroundDetalhado: async ({ nome, classe, tema }) => {
                try {
                    const promptDetalhado = createBackgroundClassePrompt(temas, classe);
                    const modelDetalhado = createBackgroundDetalhadoModel();

                    const chainDetalhado = RunnableSequence.from([
                        promptDetalhado,
                        modelDetalhado,
                    ]);

                    const response = await chainDetalhado.invoke({ nome, classe, tema });
                    console.log('👤 Background detalhado gerado para personagem:', nome);
                    
                    return {
                        background: response.content.trim(),
                        nome: nome,
                        classe: classe,
                        tema: tema,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas,
                        tipo: 'detalhado'
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar background detalhado:', error);
                    throw error;
                }
            },

            /**
             * Gerar background para múltiplos personagens
             * @param {Object} params - Parâmetros de geração
             * @param {Array} params.personagens - Lista de personagens
             * @param {string} params.tema - Tema da história
             * @returns {Object} Resultado da geração
             */
            gerarBackgroundsMultiplos: async ({ personagens, tema }) => {
                try {
                    const backgrounds = [];
                    
                    for (const personagem of personagens) {
                        const resultado = await chain.invoke({ 
                            nome: personagem.nome, 
                            classe: personagem.classe, 
                            tema: tema 
                        });
                        backgrounds.push({
                            nome: personagem.nome,
                            classe: personagem.classe,
                            background: resultado.content.trim()
                        });
                    }

                    console.log(`👤 ${backgrounds.length} backgrounds gerados para tema:`, tema);
                    
                    return {
                        backgrounds: backgrounds,
                        tema: tema,
                        quantidade: backgrounds.length,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar múltiplos backgrounds:', error);
                    throw error;
                }
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar gerador de background:', error.message);
        throw new Error(`Erro ao criar gerador de background: ${error.message}`);
    }
}

export default criarGeradorBackground; 