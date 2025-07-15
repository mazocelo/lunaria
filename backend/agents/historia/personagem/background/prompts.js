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
 * Cria o contexto de vantagens e desvantagens
 * @param {Array} vantagens - Lista de vantagens
 * @param {Array} desvantagens - Lista de desvantagens
 * @returns {string} Contexto formatado das vantagens e desvantagens
 */
function createVantagensDesvantagensContext(vantagens = [], desvantagens = []) {
    let contexto = '';
    
    if (vantagens && vantagens.length > 0) {
        contexto += `
        VANTAGENS DO PERSONAGEM:
        ${vantagens.map((vantagem, index) => `${index + 1}. ${vantagem.nome || vantagem}: ${vantagem.descricao || 'Vantagem especial'}`).join('\n')}
        `;
    }
    
    if (desvantagens && desvantagens.length > 0) {
        contexto += `
        DESVANTAGENS DO PERSONAGEM:
        ${desvantagens.map((desvantagem, index) => `${index + 1}. ${desvantagem.nome || desvantagem}: ${desvantagem.descricao || 'Desvantagem especial'}`).join('\n')}
        `;
    }
    
    return contexto;
}

/**
 * Cria o prompt para geração de background de personagem
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createBackgroundPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `
        Você é um especialista em criar backgrounds ricos e envolventes para personagens de RPG. Sua tarefa é gerar um background detalhado baseado no nome, classe, raça, tema e características fornecidas.

        INSTRUÇÕES:
        - Crie um background de 2-4 parágrafos
        - Use linguagem descritiva e narrativa
        - Inclua elementos que definam a personalidade do personagem
        - Mantenha consistência com as características do personagem (classe, raça, vantagens, desvantagens)
        - Use português brasileiro
        - Responda APENAS com o background, sem formatação adicional
        ${temasContexto}

        CARACTERÍSTICAS DO PERSONAGEM:
        - Considere a raça do personagem e como ela influencia sua história
        - Integre as vantagens e desvantagens de forma natural no background
        - As vantagens devem refletir habilidades ou características positivas
        - As desvantagens devem criar desafios ou limitações que moldaram o personagem

        SUGESTÃO DE BACKGROUND:
        - Se uma sugestão for fornecida (ex: "nobre", "carpinteiro", "aventureiro"), use-a como base para criar o background
        - A sugestão deve influenciar a origem, profissão ou estilo de vida do personagem
        - Mantenha coerência entre a sugestão, classe, raça e tema da história
        - Se a sugestão for vazia, crie um background baseado apenas na classe, raça e tema

        ESTRUTURA SUGERIDA:
        1. Primeiro parágrafo: Origem, raça e contexto familiar
        2. Segundo parágrafo: Eventos marcantes e como as vantagens/desvantagens se desenvolveram
        3. Terceiro parágrafo: Treinamento da classe e motivações
        4. Quarto parágrafo (opcional): Objetivos e aspirações atuais

        EXEMPLO DE BACKGROUND:
        "Nascido nas ruas de Porto Negro, Marcus sempre soube que a sobrevivência dependia de sua astúcia e rapidez. Órfão desde os seis anos, aprendeu a se mover nas sombras da cidade portuária, desenvolvendo vantagens que muitos considerariam questionáveis, mas que lhe garantiram não apenas a sobrevivência, mas também uma reputação entre os comerciantes locais.

        Aos quinze anos, Marcus descobriu que sua agilidade natural e reflexos rápidos o tornavam um candidato perfeito para o treinamento como ladino. Foi então que conheceu o velho Thaddeus, um ex-membro da Guilda dos Ladinos que viu potencial no jovem e decidiu treiná-lo. Durante três anos, Marcus aprendeu não apenas as técnicas de combate furtivo, mas também a arte da diplomacia e da negociação.

        Hoje, aos vinte e três anos, Marcus é conhecido como 'O Sombra de Porto Negro', um ladino habilidoso que prefere resolver conflitos com palavras quando possível, mas não hesita em usar suas lâminas quando necessário. Sua experiência nas ruas lhe deu uma compreensão única da natureza humana e uma capacidade inata de ler situações perigosas antes que elas se tornem fatais.

        Apesar de sua reputação como mercenário, Marcus mantém um código de honra pessoal: nunca rouba de quem não pode se dar ao luxo de perder, e sempre cumpre seus contratos. Seu objetivo atual é acumular recursos suficientes para fundar um abrigo para crianças órfãs, como ele próprio foi um dia."
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Nome do personagem: {nome}\nClasse: {classe}\nRaça: {raca}\nTema da história: {tema}\nSugestão de background: {sugestao_background}\nVantagens: {vantagens}\nDesvantagens: {desvantagens}'],
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

        SUGESTÃO DE BACKGROUND:
        - Se uma sugestão for fornecida (ex: "nobre", "carpinteiro", "aventureiro"), use-a como base para criar o background
        - A sugestão deve influenciar a origem, profissão ou estilo de vida do personagem
        - Mantenha coerência entre a sugestão, classe e tema da história
        - Se a sugestão for vazia, crie um background baseado apenas na classe e tema

        ELEMENTOS ESPECÍFICOS POR CLASSE:
        - Guerreiro: Treinamento militar, batalhas, honra, disciplina
        - Mago: Estudos arcanos, descoberta de poderes, academia
        - Ladino: Ruas, sobrevivência, vantagens furtivas, contatos
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
        ['human', 'Nome do personagem: {nome}\nClasse: {classe}\nTema da história: {tema}\nSugestão de background: {sugestao_background}'],
    ]);
} 