import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis para títulos
 */
function createTemasContext(temas = []) {
    if (!temas || temas.length === 0) return '';
    return `\nTEMAS PARA INSPIRAÇÃO: ${temas.join(', ')}\n`;
}

/**
 * System prompt base para geração de títulos (compartilhado)
 */
function createTituloSystemPrompt(temas, genero = '') {
    const temasContexto = createTemasContext(temas);
    const generoContexto = genero ? `\nGÊNERO ESPECÍFICO: ${genero}` : '';

    return `Você é um especialista em criar títulos criativos para histórias de RPG.

INSTRUÇÕES:
- Crie apenas UM título por vez
- 2-8 palavras, criativo e evocativo
- Tom adequado ao tema/gênero
- Português brasileiro
- Responda APENAS com o título, sem aspas, pontos ou formatação
${temasContexto}${generoContexto}
EXEMPLOS POR GÊNERO:
- Fantasia: "O Último Orvalho", "Sombras de Valyria"
- Sci-Fi: "Neblina Digital", "Ecos do Vazio"
- Horror: "Sussurros na Escuridão", "Sombras Eternas"
- Cyberpunk: "Neon e Sombras", "Código Vermelho"
- Western: "Poeira e Honra", "Terra de Ninguém"

Seja conciso, impactante e original.`;
}

/**
 * Cria o prompt para geração de títulos aleatórios
 */
export function createTituloPrompt(temas = []) {
    return ChatPromptTemplate.fromMessages([
        ['system', createTituloSystemPrompt(temas)],
        ['human', 'Tema da história: {tema}'],
    ]);
}

/**
 * Cria o prompt para geração de títulos com gênero específico
 */
export function createTituloGeneroPrompt(temas = [], genero = '') {
    return ChatPromptTemplate.fromMessages([
        ['system', createTituloSystemPrompt(temas, genero)],
        ['human', 'Tema da história: {tema}'],
    ]);
}
