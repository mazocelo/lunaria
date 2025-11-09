/**
 * Prompts para início de sessão
 */

export function criarPromptInicio(tema, personagens, cenaInicial) {
  const introducao = cenaInicial || `Bem-vindos à aventura! Vocês se encontram em um mundo onde ${tema}.`;
  
  return `Jogador: Mestre\nPersonagem: Narrador\nAção: ${introducao}`;
}

export function criarPromptBoasVindas(historiaNome, temas, personagens) {
  const temasTexto = Array.isArray(temas) ? temas.join(', ') : temas;
  const personagensTexto = Array.isArray(personagens) 
    ? personagens.map(p => p.nome || p).join(', ')
    : '';

  return `Crie uma mensagem de boas-vindas envolvente para a aventura "${historiaNome}". Os temas são: ${temasTexto}. ${personagensTexto ? `Os personagens são: ${personagensTexto}.` : ''} Seja épico, criativo e inspire os jogadores a começarem sua jornada.`;
}

export default {
  criarPromptInicio,
  criarPromptBoasVindas
};

