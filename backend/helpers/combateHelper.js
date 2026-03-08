/**
 * Helper de Combate - Formulas, dados e logica mecanica
 * Usado pelo socketManager durante combates ativos
 *
 * Sistema de defesa em 2 camadas:
 * - Esquiva: chance percentual de desviar completamente
 * - Armadura: reducao flat de dano nos hits
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
 * Calcula taxa de esquiva de um personagem (%)
 * Formula: (ModAGI + floor(ModDEX/2)) * 5 + floor(nivel*0.5) + equip_bonus - equip_penalidade
 * Cap: 0-50%
 * @param {Object} personagem - Dados do personagem
 * @param {Object} bonusEquip - Bonus agregados { esquiva_bonus, esquiva_penalidade }
 * @returns {number} Taxa de esquiva em porcentagem (0-50)
 */
export function calcularEsquiva(personagem, bonusEquip = {}) {
  const agilidade = personagem.agilidade || 10;
  const destreza = personagem.destreza || 10;
  const nivel = personagem.nivel || 1;

  const modAgi = Math.floor((agilidade - 10) / 2);
  const modDex = Math.floor((destreza - 10) / 2);

  const baseEsquiva = (modAgi + Math.floor(modDex / 2)) * 5;
  const bonusNivel = Math.floor(nivel * 0.5);
  const bonusEquipamento = bonusEquip.esquiva_bonus || 0;
  const penalidadeEquipamento = bonusEquip.esquiva_penalidade || 0;

  const total = baseEsquiva + bonusNivel + bonusEquipamento - penalidadeEquipamento;
  return Math.min(50, Math.max(0, total));
}

/**
 * Calcula armadura total de equipamentos (reducao flat de dano)
 * @param {Object} bonusEquip - Bonus agregados { armadura }
 * @returns {number} Valor de armadura
 */
export function calcularArmadura(bonusEquip = {}) {
  return bonusEquip.armadura || 0;
}

/**
 * Verifica se o alvo esquivou do ataque
 * @param {number} taxaEsquiva - Taxa de esquiva em % (0-50)
 * @returns {boolean} true se esquivou
 */
export function verificarEsquiva(taxaEsquiva) {
  return Math.random() * 100 < taxaEsquiva;
}

/**
 * Aplica formula de escalamento dinamico ao monstro
 * @param {Object} monstro - Monstro base do banco
 * @param {number} nivel - Nivel efetivo
 * @returns {Object} Stats efetivos
 */
export function calcularStatsEfetivos(monstro, nivel) {
  const n = Math.max(1, nivel);
  const modAgi = Math.floor(((monstro.agilidade || 10) - 10) / 2);
  const modTam = _getModTamanho(monstro.tamanho);

  return {
    hp_max: Math.round(monstro.hp_base + (n * monstro.constituicao * 0.5)),
    ataque: Math.round(monstro.ataque_base + Math.floor(((monstro.forca || 10) - 10) / 2) + Math.floor(n * 0.7)),
    defesa: Math.round(monstro.defesa_base + modAgi + Math.floor(n * 0.4)),
    armadura: Math.max(0, Math.round(Math.floor(monstro.defesa_base * 0.3) + Math.floor(n * 0.2) + modTam.armadura)),
    esquiva: Math.min(30, Math.max(0, (modAgi * 3) + modTam.esquiva)),
    dano_base: monstro.dano_base,
    xp: monstro.xp_base * n
  };
}

/**
 * Modificadores de combate por tamanho do monstro
 */
function _getModTamanho(tamanho) {
  const mods = {
    minusculo:    { armadura: -2, esquiva: 10 },
    pequeno:      { armadura: -1, esquiva: 5 },
    medio:        { armadura: 0,  esquiva: 0 },
    grande:       { armadura: 3,  esquiva: -5 },
    enorme:       { armadura: 5,  esquiva: -10 },
    gargantuesco: { armadura: 7,  esquiva: -13 },
    colossal:     { armadura: 8,  esquiva: -15 },
  };
  return mods[tamanho] || mods.medio;
}

/**
 * Aplica resistencias e imunidades elementais ao dano
 * @param {number} dano - Dano base calculado
 * @param {string|null} elemento - Elemento do ataque (ex: "fogo")
 * @param {Object} resistencias - Multiplicadores (ex: { fogo: 0.5 })
 * @param {Array} imunidades - Lista de imunidades (ex: ["veneno"])
 * @returns {number} Dano ajustado
 */
export function aplicarResistencias(dano, elemento, resistencias = {}, imunidades = []) {
  if (!elemento) return dano;
  if (Array.isArray(imunidades) && imunidades.includes(elemento)) return 0;
  const mult = resistencias[elemento];
  if (mult != null) return Math.max(0, Math.round(dano * mult));
  return dano;
}

/**
 * Verifica acerto baseado na rolagem do d20
 * Nat 1 = miss automatico, Nat 20 = critico
 * Para rolagens normais, o ataque sempre "acerta" — esquiva eh checada separadamente
 * @param {number} rolagem - Resultado do d20
 * @returns {{ acertou: boolean, critico: boolean }}
 */
export function verificarAcerto(rolagem) {
  if (rolagem === 20) return { acertou: true, critico: true };
  if (rolagem === 1) return { acertou: false, critico: false };
  return { acertou: true, critico: false };
}

/**
 * Calcula dano de um ataque
 * Se critico, ignora armadura (dano cheio)
 * @param {string} dano_base - Notacao do dado (ex: "1d8+2")
 * @param {number} modForca - Modificador de forca
 * @param {boolean} critico - Se acerto critico (2x dano, ignora armadura)
 * @param {number} armadura - Reducao flat de dano do alvo
 * @returns {number} Dano total
 */
export function calcularDano(dano_base, modForca = 0, critico = false, armadura = 0) {
  let dano = rolarDado(dano_base) + modForca;
  if (critico) {
    dano *= 2;
    // Critico ignora armadura
    return Math.max(1, dano);
  }
  return Math.max(1, dano - armadura);
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
          tamanho: monstroBase.tamanho || 'medio',
          nivel: nivelEfetivo,
          hp_max: stats.hp_max,
          hp_atual: stats.hp_max,
          ataque: stats.ataque,
          defesa: stats.defesa,
          armadura: stats.armadura,
          esquiva: stats.esquiva,
          dano_base: stats.dano_base,
          habilidades: monstroBase.habilidades || [],
          elemento: monstroBase.elemento || [],
          resistencias: monstroBase.resistencias || {},
          imunidades: monstroBase.imunidades || [],
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
          armadura: stats.armadura,
          esquiva: stats.esquiva,
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
    armadura: Math.round(Math.floor(n * 0.3)),
    esquiva: Math.min(20, Math.round(n * 1.5)),
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
    .map(m => `${m.nome} (HP ${m.hp_atual}/${m.hp_max}, ATK ${m.ataque}, ARM ${m.armadura || 0}, ESQ ${m.esquiva || 0}%${m.imunidades?.length ? `, Imune: ${m.imunidades.join(',')}` : ''})`)
    .join(', ');

  const monstrosDerrotados = combateState.monstros
    .filter(m => m.status === 'derrotado')
    .map(m => m.nome)
    .join(', ');

  const jogadorHP = combateState.jogadores[userId];
  const jogadorInfo = jogadorHP
    ? `HP ${jogadorHP.hp_atual}/${jogadorHP.hp_max} | Esquiva ${jogadorHP.esquiva || 0}% | Armadura ${jogadorHP.armadura || 0}`
    : 'HP desconhecido';

  // Status effects ativos de todos os jogadores
  const statusInfo = Object.entries(combateState.jogadores)
    .map(([_, j]) => {
      const efeitos = j.status_efeitos || [];
      if (efeitos.length === 0) return null;
      return `${j.personagemNome}: ${efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')}`;
    })
    .filter(Boolean)
    .join(' | ');

  let contexto = `\n[COMBATE ATIVO - Rodada ${combateState.rodadaCombate}]`;
  contexto += `\n[Monstros vivos: ${monstrosInfo || 'nenhum'}]`;
  if (monstrosDerrotados) contexto += `\n[Monstros derrotados: ${monstrosDerrotados}]`;
  contexto += `\n[Seu status: ${jogadorInfo}]`;
  if (statusInfo) contexto += `\n[Efeitos ativos: ${statusInfo}]`;

  return contexto;
}

export default {
  rolarDado,
  calcularHP,
  calcularEsquiva,
  calcularArmadura,
  verificarEsquiva,
  calcularStatsEfetivos,
  verificarAcerto,
  calcularDano,
  aplicarResistencias,
  selecionarHabilidadeMonstro,
  gerarInstanciasCombate,
  verificarFimCombate,
  formatarContextoCombate
};
