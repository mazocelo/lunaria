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
        Você é um especialista em criar backgrounds ricos e envolventes para personagens de RPG. Sua tarefa é gerar um background detalhado baseado no nome, classe e tema fornecidos.

        INSTRUÇÕES:
        - Crie um background de 2-4 parágrafos
        - Use linguagem descritiva e narrativa
        - Inclua elementos que definam a personalidade do personagem
        - Mantenha consistência com o tema e classe
        - Use português brasileiro
        - Responda APENAS com o background, sem formatação adicional
        ${temasContexto}

        ESTRUTURA SUGERIDA:
        1. Primeiro parágrafo: Origem e contexto familiar
        2. Segundo parágrafo: Eventos marcantes e motivações
        3. Terceiro parágrafo: Habilidades e características únicas
        4. Quarto parágrafo (opcional): Objetivos e aspirações

        EXEMPLO DE BACKGROUND:
        "Nascido nas ruas de Porto Negro, Marcus sempre soube que a sobrevivência dependia de sua astúcia e rapidez. Órfão desde os seis anos, aprendeu a se mover nas sombras da cidade portuária, desenvolvendo habilidades que muitos considerariam questionáveis, mas que lhe garantiram não apenas a sobrevivência, mas também uma reputação entre os comerciantes locais.

        Aos quinze anos, Marcus descobriu que sua agilidade natural e reflexos rápidos o tornavam um candidato perfeito para o treinamento como ladino. Foi então que conheceu o velho Thaddeus, um ex-membro da Guilda dos Ladinos que viu potencial no jovem e decidiu treiná-lo. Durante três anos, Marcus aprendeu não apenas as técnicas de combate furtivo, mas também a arte da diplomacia e da negociação.

        Hoje, aos vinte e três anos, Marcus é conhecido como 'O Sombra de Porto Negro', um ladino habilidoso que prefere resolver conflitos com palavras quando possível, mas não hesita em usar suas lâminas quando necessário. Sua experiência nas ruas lhe deu uma compreensão única da natureza humana e uma capacidade inata de ler situações perigosas antes que elas se tornem fatais.

        Apesar de sua reputação como mercenário, Marcus mantém um código de honra pessoal: nunca rouba de quem não pode se dar ao luxo de perder, e sempre cumpre seus contratos. Seu objetivo atual é acumular recursos suficientes para fundar um abrigo para crianças órfãs, como ele próprio foi um dia."
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Nome do personagem: {nome}\nClasse: {classe}\nTema da história: {tema}'],
    ]);
}

/**
 * Cria o prompt para geração de background com classe específica
 * @param {Array} temas - Lista de temas disponíveis
 * @param {string} classe - Classe específica do personagem
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createBackgroundClassePrompt(temas = [], classe = '') {
    const temasContexto = createTemasContext(temas);
    const classeContexto = classe ? `CLASSE ESPECÍFICA: ${classe}` : '';

    const systemPrompt = `
        Você é um especialista em criar backgrounds para personagens de RPG. Sua tarefa é gerar um background detalhado baseado no nome, classe e tema fornecidos.

        INSTRUÇÕES:
        - Crie um background de 2-4 parágrafos
        - Use linguagem descritiva e narrativa
        - Inclua elementos específicos da classe escolhida
        - Mantenha consistência com o tema
        - Use português brasileiro
        - Responda APENAS com o background, sem formatação adicional
        ${temasContexto}
        ${classeContexto}

        ELEMENTOS ESPECÍFICOS POR CLASSE:
        - Guerreiro: Treinamento militar, batalhas, honra, disciplina
        - Mago: Estudos arcanos, descoberta de poderes, academia
        - Ladino: Ruas, sobrevivência, habilidades furtivas, contatos
        - Clérigo: Fé, templo, chamado divino, missão sagrada
        - Ranger: Natureza, caça, isolamento, conexão com animais
        - Bardo: Arte, performance, viagens, inspiração

        REGRAS:
        - Background deve ser coerente com a classe
        - Inclua motivações e objetivos
        - Mantenha originalidade
        - Use elementos que definam a personalidade
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Nome do personagem: {nome}\nClasse: {classe}\nTema da história: {tema}'],
    ]);
} 