import { ChatGroq } from '@langchain/groq'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import dotenv from 'dotenv'

dotenv.config();

// Constantes globais
const DEFAULT_MODEL_SETTINGS = {
    model: 'gemma2-9b-it',
    temperature: 0.9, // Alta criatividade para narração
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

// Cria o prompt para o mestre de RPG
function createMestrePrompt(temas = [], personagens = []) {
    let temasContexto = '';
    if (temas && temas.length > 0) {
        temasContexto = `
        ### TEMAS DA CAMPANHA:
        ${temas.map((tema, index) => `${index + 1}. ${tema}`).join('\n')}
        Use esses temas para compor o cenário, o clima, as criaturas, os eventos e as ameaças que surgem ao longo da aventura. Misture os temas com criatividade.
        `;
    }

    let personagensContexto = '';
    if (personagens && personagens.length > 0) {
        personagensContexto = `
        ### PERSONAGENS JOGANDO:
        ${personagens.map((personagem, index) => `${index + 1}. ${personagem}`).join('\n')}
        Cada personagem tem papel ativo na história. Considere suas características, objetivos, medos e habilidades ao narrar o desenrolar das ações.
        `;
    }

    const systemPrompt = `
        Você é um Mestre de RPG envolvente, criativo e interativo. Sua missão é narrar uma aventura textual baseada nos temas e personagens abaixo. O jogador fornece entradas com o nome do jogador, nome do personagem e a ação desejada. Responda com a narração do que acontece a seguir.

        ${temasContexto}
        ${personagensContexto}

        ### REGRAS DO MESTRE:
        - Comece com uma introdução imersiva se for a primeira interação.
        - Sempre reaja com criatividade e coerência à ação do personagem.
        - Descreva o ambiente, os efeitos da ação e os desdobramentos narrativos.
        - Estimule escolhas, consequências e conflitos.
        - Ao final de cada resposta, convide o jogador a continuar com **"O que você faz?"** ou **"Qual será sua próxima ação?"**
        - Não finalize a aventura, a menos que a história peça por isso naturalmente.
        - Narre de forma descritiva, mantendo o ritmo e a emoção da cena.
        - Considere o tom dos temas: sombrio, épico, humorístico, caótico, etc.
        - Nunca tome decisões pelo personagem — apenas descreva as consequências das ações do jogador.

        ### FORMATO DE INPUT:
        O jogador enviará mensagens no seguinte formato:

        **Jogador:** Nome do jogador  
        **Personagem:** Nome do personagem  
        **Ação:** O que o personagem está tentando fazer

        ### EXEMPLO DE INPUT:
        Jogador: Marcelo  
        Personagem: Thalor, o Tecelão de Névoas  
        Ação: Tento atravessar a ponte de corda rapidamente antes que desabe.

        ### EXEMPLO DE RESPOSTA:
        > Thalor corre pela ponte instável, suas botas ecoando nas tábuas podres. O rangido das cordas aumenta conforme ele avança. Lá embaixo, o abismo ruge com a névoa viva que se agita faminta. Quando ele está a meio caminho, ouve um estalo seco atrás de si…

        > **O que você faz?**

        ### INSTRUÇÕES IMPORTANTES:
        - Use português brasileiro
        - Mantenha a imersão e o suspense
        - Seja criativo com as consequências das ações
        - Adapte o tom ao contexto dos temas
        - Sempre termine com uma pergunta que convide à ação
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
    ]);
}

// Cria o agente mestre de RPG
async function criarMestreRPG(temas = [], personagens = []) {
    try {
        const prompt = createMestrePrompt(temas, personagens);
        const model = generateModel({ temperature: 0.9 }); // Alta criatividade para narração

        const chain = RunnableSequence.from([
            {
                input: (input) => input.input,
                chat_history: async () => {
                    return [];
                },
            },
            prompt,
            model,
        ]);

        return {
            // Narrar ação do jogador
            narrarAcao: async ({ jogador, personagem, acao, chatHistory = [] }) => {
                const input = `Jogador: ${jogador}\nPersonagem: ${personagem}\nAção: ${acao}`;
                
                const response = await chain.invoke({ 
                    input,
                    chat_history: chatHistory
                });
                
                console.log('🎭 Ação narrada para:', personagem);
                return {
                    narracao: response.content,
                    jogador: jogador,
                    personagem: personagem,
                    acao: acao,
                    timestamp: new Date().toISOString()
                };
            },

            // Iniciar nova sessão
            iniciarSessao: async ({ tema, personagens, cenaInicial }) => {
                const introducao = cenaInicial || `Bem-vindos à aventura! Vocês se encontram em um mundo onde ${tema}.`;
                
                const input = `Jogador: Mestre\nPersonagem: Narrador\nAção: ${introducao}`;
                
                const response = await chain.invoke({ 
                    input,
                    chat_history: []
                });
                
                console.log('🎮 Sessão iniciada com tema:', tema);
                return {
                    introducao: response.content,
                    tema: tema,
                    personagens: personagens,
                    timestamp: new Date().toISOString()
                };
            },

            // Processar resposta do mestre
            processarResposta: async ({ input, chatHistory = [] }) => {
                const response = await chain.invoke({ 
                    input,
                    chat_history: chatHistory
                });
                
                console.log('💬 Resposta do mestre processada');
                return {
                    resposta: response.content,
                    timestamp: new Date().toISOString()
                };
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar mestre de RPG:', error.message);
        throw new Error(`Erro ao criar mestre de RPG: ${error.message}`);
    }
}

export default criarMestreRPG; 