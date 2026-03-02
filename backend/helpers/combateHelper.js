/**
 * Helper de Combate - Formulas, dados e logica mecanica
 * Usado pelo socketManager durante combates ativos
 */

/**
 * Parseia notacao de dado (ex: "2d6+3") e retorna resultado
 * @param {string} notacao - Ex: "1d6", "2d8+3", "1d20-1"
 * @returns {number} Resultado da rolagem
 */
export function rolarDado(notacao) {
  if (!notacao || typeof notacao !== 'string') return 0;

  const match = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return 0;

  const quantidade = parseInt(match[1]);
  const faces = parseInt(match[2]);
  const modificador = match[3] ? parseInt(match[3]) : 0;

  let total = 0;
  for (let i = 0; i < quantidade; i++) {
    total += Math.floor(Math.random() * faces) + 1;
  }

  return Math.max(0, total + modificador);
}

/**
 * Calcula HP maximo de um personagem jogador
 * @param {Object} personagem - Dados do personagem
 * @returns {number} HP maximo
 */
export function calcularHP(personagem) {
  const constituicao = personagem.constituicao || 10;
  const nivel = personagem.nivel || 1;
  const modConstituicao = Math.floor((constituicao - 10) / 2);
  return Math.max(1, 10 + (modConstituicao * nivel));
}

/**
 * Calcula Classe de Armadura de um personagem
 * @param {Object} personagem - Dados do personagem
 * @returns {number} CA
 */
export function calcularCA(personagem) {
  const destreza = personagem.destreza || 10;
  const modDestreza = Math.floor((destreza - 10) / 2);
  return 10 + modDestreza;
}

/**
 * Aplica formula de escalamento dinamico ao monstro
 * @param {Object} monstro - Monstro base do banco
 * @param {number} nivel - Nivel efetivo
 * @returns {Object} Stats efetivos
 */
export function calcularStatsEfetivos(monstro, nivel) {
  const n = Math.max(1, nivel);
  return {
    hp_max: Math.round(monstro.hp_base + (n * monstro.constituicao * 0.5)),
    ataque: Math.round(monstro.ataque_base + Math.floor((monstro.forca - 10) / 2) + Math.floor(n * 0.7)),
    defesa: Math.round(monstro.defesa_base + Math.floor((monstro.agilidade - 10) / 2) + Math.floor(n * 0.4)),
    dano_base: monstro.dano_base,
    xp: monstro.xp_base * n
  };
}

/**
 * Verifica se ataque acertou
 * @param {number} rolagem - Resultado do d20
 * @param {number} bonusAtaque - Bonus de ataque do atacante
 * @param {number} defesaAlvo - CA/defesa do alvo
 * @returns {{ acertou: boolean, critico: boolean }}
 */
export function verificarAcerto(rolagem, bonusAtaque, defesaAlvo) {
  if (rolagem === 20) return { acertou: true, critico: true };
  if (rolagem === 1) return { acertou: false, critico: false };
  return {
    acertou: (rolagem + bonusAtaque) >= defesaAlvo,
    critico: false
  };
}

/**
 * Calcula dano de um ataque
 * @param {string} dano_base - Notacao do dado (ex: "1d8+2")
 * @param {number} modForca - Modificador de forca
 * @param {boolean} critico - Se acerto critico (2x dano)
 * @returns {number} Dano total
 */
export function calcularDano(dano_base, modForca = 0, critico = false) {
  let dano = rolarDado(dano_base) + modForca;
  if (critico) dano *= 2;
  return Math.max(1, dano);
}

/**
 * Seleciona habilidade do monstro baseado em cooldown e chance
 * @param {Object} monstro - Instancia do monstro com cooldowns
 * @param {number} rodadaCombate - Rodada atual do combate
 * @returns {Object|null} Habilidade selecionada ou null (ataque basico)
 */
export function selecionarHabilidadeMonstro(monstro, rodadaCombate) {
  const habilidades = monstro.habilidades || [];
  if (habilidades.length === 0) return null;

  const cooldowns = monstro.cooldowns || {};

  const disponiveis = habilidades.filter(hab => {
    const ultimoUso = cooldowns[hab.nome] || 0;
    const cooldown = hab.cooldown || 0;
    return (rodadaCombate - ultimoUso) >= cooldown;
  });

  if (disponiveis.length === 0) return null;

  // Selecionar baseado na chance de cada habilidade
  for (const hab of disponiveis) {
    const chance = hab.chance || 30;
    if (Math.random() * 100 < chance) {
      return hab;
    }
  }

  return null;
}

/**
 * Gera instancias de combate a partir de dados da IA e do banco
 * @param {Array} monstrosBanco - Monstros encontrados no banco
 * @param {Array} monstrosIA - Monstros sugeridos pela IA [{nome, tipo, quantidade, nivel_sugerido}]
 * @param {number} nivelMedio - Nivel medio dos jogadores
 * @returns {Array} Instancias prontas para combate
 */
export function gerarInstanciasCombate(monstrosBanco, monstrosIA, nivelMedio) {
  const instancias = [];
  let idCounter = 1;

  for (const sugestao of monstrosIA) {
    const quantidade = Math.min(sugestao.quantidade || 1, 5); // Max 5 por tipo
    const nivelEfetivo = sugestao.nivel_sugerido || nivelMedio;

    // Encontrar monstro correspondente no banco
    const monstroBase = monstrosBanco.find(m =>
      m.nome.toLowerCase().includes(sugestao.nome.toLowerCase().split(' ')[0])
    );

    for (let i = 0; i < quantidade; i++) {
      if (monstroBase) {
        // Monstro encontrado no banco - usar stats reais
        const stats = calcularStatsEfetivos(monstroBase, nivelEfetivo);
        instancias.push({
          id: `${monstroBase.nome.toLowerCase().replace(/\s/g, '_')}_${idCounter++}`,
          monstroId: monstroBase.id,
          nome: quantidade > 1 ? `${monstroBase.nome} ${String.fromCharCode(64 + i + 1)}` : monstroBase.nome,
          tipo: monstroBase.tipo[0] || 'besta',
          nivel: nivelEfetivo,
          hp_max: stats.hp_max,
          hp_atual: stats.hp_max,
          ataque: stats.ataque,
          defesa: stats.defesa,
          dano_base: stats.dano_base,
          habilidades: monstroBase.habilidades || [],
          elemento: monstroBase.elemento || [],
          xp: stats.xp,
          status: 'vivo',
          cooldowns: {}
        });
      } else {
        // Monstro nao encontrado - gerar generico
        const stats = _gerarStatsGenericos(nivelEfetivo, sugestao.tipo);
        instancias.push({
          id: `${sugestao.nome.toLowerCase().replace(/\s/g, '_')}_${idCounter++}`,
          monstroId: null,
          nome: quantidade > 1 ? `${sugestao.nome} ${String.fromCharCode(64 + i + 1)}` : sugestao.nome,
          tipo: sugestao.tipo || 'besta',
          nivel: nivelEfetivo,
          hp_max: stats.hp_max,
          hp_atual: stats.hp_max,
          ataque: stats.ataque,
          defesa: stats.defesa,
          dano_base: stats.dano_base,
          habilidades: [],
          elemento: [],
          xp: stats.xp,
          status: 'vivo',
          cooldowns: {}
        });
      }
    }
  }

  return instancias;
}

/**
 * Gera stats genericos para monstro nao encontrado no banco
 */
function _gerarStatsGenericos(nivel, tipo) {
  const n = Math.max(1, nivel);
  const baseHP = tipo === 'dragao' ? 30 : tipo === 'demonio' ? 25 : 15;
  return {
    hp_max: Math.round(baseHP + (n * 5)),
    ataque: Math.round(2 + Math.floor(n * 0.7)),
    defesa: Math.round(10 + Math.floor(n * 0.4)),
    dano_base: n <= 3 ? '1d6' : n <= 6 ? '1d8' : '1d10',
    xp: 50 * n
  };
}

/**
 * Verifica se o combate acabou
 * @param {Object} combateState - Estado do combate no Redis
 * @returns {{ finalizado: boolean, resultado: string|null }}
 */
export function verificarFimCombate(combateState) {
  if (!combateState || !combateState.ativo) {
    return { finalizado: false, resultado: null };
  }

  const monstrosVivos = combateState.monstros.filter(m => m.status === 'vivo');
  const jogadoresVivos = Object.values(combateState.jogadores).filter(j => j.status === 'vivo');

  if (monstrosVivos.length === 0) {
    return { finalizado: true, resultado: 'vitoria' };
  }

  if (jogadoresVivos.length === 0) {
    return { finalizado: true, resultado: 'derrota' };
  }

  return { finalizado: false, resultado: null };
}

/**
 * Formata contexto de combate para injetar no prompt da IA
 * @param {Object} combateState - Estado do combate
 * @param {string} userId - ID do jogador atual
 * @returns {string} Contexto formatado
 */
export function formatarContextoCombate(combateState, userId) {
  if (!combateState?.ativo) return '';

  const monstrosInfo = combateState.monstros
    .filter(m => m.status === 'vivo')
    .map(m => `${m.nome} (HP ${m.hp_atual}/${m.hp_max}, ATK ${m.ataque}, DEF ${m.defesa})`)
    .join(', ');

  const monstrosDerrotados = combateState.monstros
    .filter(m => m.status === 'derrotado')
    .map(m => m.nome)
    .join(', ');

  const jogadorHP = combateState.jogadores[userId];
  const jogadorInfo = jogadorHP
    ? `HP ${jogadorHP.hp_atual}/${jogadorHP.hp_max} | CA ${jogadorHP.ca}`
    : 'HP desconhecido';

  let contexto = `\n[COMBATE ATIVO - Rodada ${combateState.rodadaCombate}]`;
  contexto += `\n[Monstros vivos: ${monstrosInfo || 'nenhum'}]`;
  if (monstrosDerrotados) contexto += `\n[Monstros derrotados: ${monstrosDerrotados}]`;
  contexto += `\n[Seu status: ${jogadorInfo}]`;

  return contexto;
}

export default {
  rolarDado,
  calcularHP,
  calcularCA,
  calcularStatsEfetivos,
  verificarAcerto,
  calcularDano,
  selecionarHabilidadeMonstro,
  gerarInstanciasCombate,
  verificarFimCombate,
  formatarContextoCombate
};
