import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis para background
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {string} Contexto formatado dos temas
 */
function createTemasContext(temas = []) {
    if (!temas || temas.length === 0) {
        return '';
    }

    return `
    TEMAS DISPONÍVEIS PARA INSPIRAÇÃO:
    ${temas.map((tema, index) => `${index + 1}. ${tema}`).join('\n')}

    Use estes temas como referência para criar um background coerente com o universo da história.
    `;
}

/**
 * Cria o prompt para geração de background de personagem
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createBackgroundPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `
        Você é um especialista em criar backgrounds ricos e envolventes para personagens de RPG. Sua tarefa é gerar um background detalhado baseado em TODOS os dados fornecidos da ficha do personagem.

        INSTRUÇÕES:
        - Crie um background de 2-4 parágrafos
        - Use linguagem descritiva e narrativa
        - Inclua elementos que definam a personalidade do personagem
        - Mantenha consistência com TODAS as características: classe, raça, vantagens, desvantagens, atributos, equipamentos
        - Use português brasileiro
        - Responda APENAS com o background, sem formatação adicional
        ${temasContexto}

        ATRIBUTOS DO PERSONAGEM:
        - Atributos ALTOS (15+) devem ser refletidos como características marcantes na narrativa
        - Atributos BAIXOS (7-) devem ser mencionados como limitações ou desafios
        - Exemplo: Força 18 = fisicamente imponente; Inteligência 5 = simples de mente; Carisma 17 = naturalmente cativante
        - O nível do personagem reflete sua experiência: nível 1 = novato, nível 10+ = veterano

        VANTAGENS E DESVANTAGENS:
        - Integre as vantagens de forma natural - são habilidades ou características positivas que o personagem desenvolveu
        - Desvantagens criam desafios ou limitações que moldaram a história do personagem
        - Explique COMO o personagem adquiriu essas características

        EQUIPAMENTOS:
        - Equipamentos notáveis (armas mágicas, armaduras especiais) devem ser mencionados naturalmente
        - Conte brevemente como o personagem obteve itens importantes
        - Equipamentos comuns podem ser ignorados

        SUGESTÃO DE BACKGROUND:
        - Se uma sugestão for fornecida (ex: "nobre", "carpinteiro", "aventureiro"), use-a como base
        - A sugestão influencia a origem, profissão ou estilo de vida do personagem
        - Mantenha coerência entre a sugestão e todos os outros dados
        - Se a sugestão for vazia, crie um background baseado nos dados disponíveis

        ESTRUTURA SUGERIDA:
        1. Primeiro parágrafo: Origem, raça e contexto familiar
        2. Segundo parágrafo: Eventos marcantes e como as vantagens/desvantagens se desenvolveram
        3. Terceiro parágrafo: Treinamento da classe, equipamentos importantes e motivações
        4. Quarto parágrafo (opcional): Objetivos e aspirações atuais
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', `Nome: {nome}
Classe: {classe}
Raça: {raca}
Nível: {nivel}
Atributos: FOR {forca} | INT {inteligencia} | CAR {carisma} | DES {destreza} | CON {constituicao} | AGI {agilidade}
Tema da história: {tema}
Sugestão de background: {sugestao_background}
Vantagens: {vantagens}
Desvantagens: {desvantagens}
Equipamentos: {equipamentos}`],
    ]);
}
