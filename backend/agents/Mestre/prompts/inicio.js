/**
 * Prompts para início de sessão
 */

export function criarPromptInicio(tema, personagens, cenaInicial) {
  const intro = cenaInicial || `Uma nova aventura começa em um mundo onde ${tema}.`;

  const persTexto = Array.isArray(personagens) && personagens.length > 0
    ? `\nPersonagens presentes: ${personagens.map(p => p.nome || p).join(', ')}`
    : '';

  return `INÍCIO DE SESSÃO${persTexto}

Cena inicial: ${intro}

Como Mestre, crie uma introdução imersiva que:
1. Estabeleça o cenário e a atmosfera
2. Apresente a situação atual dos personagens
3. Crie um gancho narrativo que incentive ação imediata
4. Termine convidando os jogadores a agir

Responda no formato JSON padrão (narrativa, fimDeTurno: false, etc).`;
}

export function criarPromptBoasVindas(historiaNome, temas, personagens) {
  const temasTexto = Array.isArray(temas) ? temas.join(', ') : temas;
  const personagensTexto = Array.isArray(personagens)
    ? personagens.map(p => p.nome || p).join(', ')
    : '';

  return `BOAS-VINDAS À AVENTURA "${historiaNome}"

Temas: ${temasTexto}
${personagensTexto ? `Personagens: ${personagensTexto}` : ''}

Crie uma mensagem de boas-vindas épica e imersiva que:
1. Apresente o mundo e a atmosfera da aventura
2. Faça referência aos temas de forma criativa
3. Inspire os jogadores a começarem sua jornada
4. Termine com um gancho que convide à ação

Responda no formato JSON padrão (narrativa, fimDeTurno: false, etc).`;
}

export default {
  criarPromptInicio,
  criarPromptBoasVindas
};
