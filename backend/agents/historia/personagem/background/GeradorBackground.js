import { RunnableSequence } from '@langchain/core/runnables';
import { createBackgroundModel } from './model.js';
import { createBackgroundPrompt } from './prompts.js';

/**
 * Cria o agente para geração de background de personagens
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com método para gerar background
 */
async function criarGeradorBackground(temas = []) {
    try {
        const prompt = createBackgroundPrompt(temas);
        const model = createBackgroundModel({ model: "meta-llama/llama-4-scout-17b-16e-instruct" });

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
             * @param {string} params.raca - Raça do personagem
             * @param {string} params.tema - Tema da história
             * @param {string} params.sugestao_background - Sugestão de background
             * @param {Array} params.vantagens - Lista de vantagens do personagem
             * @param {Array} params.desvantagens - Lista de desvantagens do personagem
             * @param {number} params.nivel - Nível do personagem
             * @param {number} params.forca - Força
             * @param {number} params.inteligencia - Inteligência
             * @param {number} params.carisma - Carisma
             * @param {number} params.destreza - Destreza
             * @param {number} params.constituicao - Constituição
             * @param {number} params.agilidade - Agilidade
             * @param {string} params.equipamentos - Equipamentos formatados
             * @returns {Object} Resultado da geração
             */
            gerarBackground: async ({
                nome, classe, raca, tema, sugestao_background = '',
                vantagens = [], desvantagens = [],
                nivel = 1, forca = 10, inteligencia = 10, carisma = 10,
                destreza = 10, constituicao = 10, agilidade = 10,
                equipamentos = 'Nenhum'
            }) => {
                try {
                    const response = await chain.invoke({
                        nome,
                        classe,
                        raca,
                        tema,
                        sugestao_background,
                        vantagens,
                        desvantagens,
                        nivel: String(nivel),
                        forca: String(forca),
                        inteligencia: String(inteligencia),
                        carisma: String(carisma),
                        destreza: String(destreza),
                        constituicao: String(constituicao),
                        agilidade: String(agilidade),
                        equipamentos
                    });

                    console.log('👤 Background gerado para personagem:', nome);

                    return {
                        background: response.content.trim(),
                        nome,
                        classe,
                        raca,
                        tema,
                        sugestao_background,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar background:', error);
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
