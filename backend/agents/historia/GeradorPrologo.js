import { ChatGroq } from '@langchain/groq'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import dotenv from 'dotenv'

dotenv.config();

// Constantes globais
const DEFAULT_MODEL_SETTINGS = {
    model: 'gemma2-9b-it',
    temperature: 0.8, // Mais criativo para prólogos
    maxTokens: 8000,
    topP: 0.99,
    language: 'pt-br',
};

// Gera o modelo da Groq
function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}

// Cria o prompt para geração de prólogo
function createPrologoPrompt(temas = []) {
    let temasContexto = '';
    if (temas && temas.length > 0) {
        temasContexto = `
        TEMAS DISPONÍVEIS PARA INSPIRAÇÃO:
        ${temas.map((tema, index) => `${index + 1}. ${tema}`).join('\n')}
        
        Use estes temas como referência para criar um prólogo rico e diversificado.
        `;
    }

    const systemPrompt = `
        Você é um mestre de RPG experiente e criativo. Sua tarefa é criar um prólogo envolvente para uma história de RPG baseada no tema fornecido.

        INSTRUÇÕES:
        - Crie um prólogo de 3-4 parágrafos
        - Use linguagem descritiva e atmosférica
        - Inclua elementos que despertem a curiosidade dos jogadores
        - Mantenha um tom adequado ao tema (fantasia, sci-fi, horror, etc.)
        - Evite revelar muito sobre a trama principal
        - Crie um gancho narrativo que incentive os jogadores a explorar
        - Use português brasileiro
        - Responda APENAS com o prólogo, sem formatação adicional
        ${temasContexto}

        ESTRUTURA SUGERIDA:
        1. Primeiro parágrafo: Contexto geral e atmosfera
        2. Segundo parágrafo: Introdução de elementos misteriosos ou conflitos
        3. Terceiro parágrafo: Gancho narrativo para os jogadores
        4. Quarto parágrafo (opcional): Dica sobre o que os jogadores podem esperar

        EXEMPLO DE TEMA: "Fantasia Medieval - Uma cidade portuária amaldiçoada"
        EXEMPLO DE PRÓLOGO:
        "Nas margens do Mar de Esmeraldas, ergue-se a antiga cidade de Porto Negro, suas torres de pedra negra se estendendo contra o horizonte como dedos ossudos apontando para o céu. Fundada há séculos pelos navegadores do Império de Valyria, a cidade já foi o centro do comércio marítimo, suas docas repletas de navios carregados de especiarias, sedas e ouro. Mas aqueles dias de glória se foram, substituídos por uma maldição que assombra as ruas estreitas e os becos escuros.

        Dizem que a maldição começou quando o último rei de Porto Negro, o orgulhoso Alaric o Conquistador, desafiou os deuses do mar ao construir sua fortaleza sobre as ruínas de um templo antigo. Os pescadores juram que ainda podem ouvir os lamentos dos marinheiros perdidos ecoando pelas noites de lua cheia, e os comerciantes evitam as docas ao anoitecer, temendo o que pode emergir das águas escuras.

        Agora, uma nova ameaça se aproxima. Navios mercantes desaparecem sem deixar rastro, e os poucos sobreviventes que retornam falam de criaturas que se movem nas sombras e de uma névoa que não se dissipa. O Conselho dos Mercadores, desesperado por uma solução, oferece uma recompensa generosa para qualquer grupo de aventureiros corajosos o suficiente para investigar os mistérios de Porto Negro.

        Como heróis destemidos, vocês foram convocados para desvendar os segredos da cidade amaldiçoada. Mas cuidado, pois nem tudo é o que parece em Porto Negro, e alguns segredos são melhor deixados no fundo do mar..."
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
}

// Cria o agente para geração de prólogo
async function criarGeradorPrologo(temas = []) {
    try {
        const prompt = createPrologoPrompt(temas);
        const model = generateModel({ temperature: 0.8 }); // Mais criativo para prólogos

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            // Gerar prólogo para um tema específico
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

            // Gerar história completa com prólogo
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
                            modelo: 'gemma2-9b-it',
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