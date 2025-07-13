import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis para títulos
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
    
    Use estes temas como referência para criar títulos criativos e envolventes.
    `;
}

/**
 * Cria o prompt para geração de títulos aleatórios
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createTituloPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `
        Você é um especialista em criar títulos criativos e envolventes para histórias de RPG. Sua tarefa é gerar um título único e atrativo baseado no tema fornecido.

        INSTRUÇÕES:
        - Crie apenas UM título por vez
        - Use linguagem criativa e evocativa
        - O título deve ter entre 2-8 palavras
        - Inclua elementos que despertem curiosidade
        - Mantenha um tom adequado ao tema (fantasia, sci-fi, horror, etc.)
        - Use português brasileiro
        - Responda APENAS com o título, sem formatação adicional
        - Não use aspas, pontos ou outros símbolos
        ${temasContexto}

        EXEMPLOS DE TÍTULOS POR TEMA:
        - Fantasia Medieval: "O Último Orvalho", "Sombras de Valyria", "A Torre Perdida"
        - Sci-Fi: "Neblina Digital", "Ecos do Vazio", "O Último Portal"
        - Horror: "Sussurros na Escuridão", "A Última Chamada", "Sombras Eternas"
        - Cyberpunk: "Neon e Sombras", "Código Vermelho", "Matrix Urbana"
        - Western: "Poeira e Honra", "O Último Duelo", "Terra de Ninguém"

        REGRAS:
        - Título deve ser conciso e impactante
        - Evite clichês excessivos
        - Mantenha originalidade
        - Use palavras que criem atmosfera
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
}

/**
 * Cria o prompt para geração de títulos com gênero específico
 * @param {Array} temas - Lista de temas disponíveis
 * @param {string} genero - Gênero específico (fantasia, sci-fi, horror, etc.)
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createTituloGeneroPrompt(temas = [], genero = '') {
    const temasContexto = createTemasContext(temas);
    const generoContexto = genero ? `GÊNERO ESPECÍFICO: ${genero}` : '';

    const systemPrompt = `
        Você é um especialista em criar títulos criativos para histórias de RPG. Sua tarefa é gerar um título único baseado no tema e gênero fornecidos.

        INSTRUÇÕES:
        - Crie apenas UM título por vez
        - Use linguagem criativa e evocativa
        - O título deve ter entre 2-8 palavras
        - Mantenha o tom adequado ao gênero especificado
        - Use português brasileiro
        - Responda APENAS com o título, sem formatação adicional
        ${temasContexto}
        ${generoContexto}

        EXEMPLOS POR GÊNERO:
        - Fantasia: "O Último Orvalho", "Sombras de Valyria", "A Torre Perdida"
        - Sci-Fi: "Neblina Digital", "Ecos do Vazio", "O Último Portal"
        - Horror: "Sussurros na Escuridão", "A Última Chamada", "Sombras Eternas"
        - Cyberpunk: "Neon e Sombras", "Código Vermelho", "Matrix Urbana"
        - Western: "Poeira e Honra", "O Último Duelo", "Terra de Ninguém"

        REGRAS:
        - Título deve ser conciso e impactante
        - Evite clichês excessivos
        - Mantenha originalidade
        - Use palavras que criem atmosfera
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
} 