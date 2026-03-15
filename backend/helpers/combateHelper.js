/**
 * Helper de Combate - Formulas, dados e logica mecanica
 * Usado pelo socketManager durante combates ativos
 *
 * Sistema de defesa em 2 camadas:
 * - Esquiva: chance percentual de desviar completamente
 * - Armadura: reducao flat de dano nos hits
 */
import logger from './logger.js';
import {
  TAMANHO_MODS,
  STATUS_IMPEDE_ACAO,
  STATUS_DANO_POR_TURNO,
  STATUS_PENALIDADE_ATAQUE,
  STATUS_COMBATENTE,
  RESULTADO_COMBATE,
} from '../config/domainConstants.js';
const log = logger.child({ module: 'combateHelper' });

/**
 * Parseia notacao de dado (ex: "2d6+3") e retorna resultado
 * @param {string} notacao - Ex: "1d6", "2d8+3", "1d20-1"
 * @returns {number} Resultado da rolagem
 */
export function rolarDado(notacao) {
  if (!notacao || typeof notacao !== 'string') {
    log.warn({ tipo: typeof notacao, notacao }, 'rolarDado: notacao invalida');
    return 1;
  }

  const match = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    log.warn({ notacao }, 'rolarDado: notacao nao reconhecida');
    return 1;
  }

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
  return Math.max(1, 10 + (nivel * 2) + (modConstituicao * nivel));
}

/**
 * Calcula mana maxima de um personagem
 * Formula: 10 + nivel + modInteligencia * 2
 */
export function calcularMana(personagem) {
  const inteligencia = personagem.inteligencia || 10;
  const nivel = personagem.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  return Math.max(5, 10 + nivel + modInt * 2);
}

/**
 * Valida e processa uso de habilidade ativa em combate
 * @returns {{ valido: boolean, erro?: string, dano?: number, efeito?: object }}
 */
export function processarHabilidade(habilidade, jogadorState) {
  const { mana_atual = 0, cooldowns = {} } = jogadorState;

  // Verificar mana
  if (habilidade.custo_mana > 0 && mana_atual < habilidade.custo_mana) {
    return { valido: false, erro: `Mana insuficiente (${mana_atual}/${habilidade.custo_mana})` };
  }

  // Verificar cooldown
  const cdRestante = cooldowns[habilidade.id] || 0;
  if (cdRestante > 0) {
    return { valido: false, erro: `Habilidade em cooldown (${cdRestante} turnos)` };
  }

  // Calcular dano se aplicável
  let dano = 0;
  if (habilidade.dano_base) {
    dano = rolarDado(habilidade.dano_base);
  }

  return {
    valido: true,
    dano,
    custoMana: habilidade.custo_mana,
    cooldown: habilidade.cooldown_turnos,
    efeito: habilidade.efeito || null
  };
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
  const hpBase = monstro.hp_base || 10;
  const constituicao = monstro.constituicao || 10;
  const forca = monstro.forca || 10;
  const ataqueBase = monstro.ataque_base || 2;
  const defesaBase = monstro.defesa_base || 10;
  const xpBase = monstro.xp_base || 50;
  const modAgi = Math.floor(((monstro.agilidade || 10) - 10) / 2);
  const modTam = _getModTamanho(monstro.tamanho);

  return {
    hp_max: Math.round(hpBase + (n * constituicao * 0.5)),
    ataque: Math.round(ataqueBase + Math.floor((forca - 10) / 2) + Math.floor(n * 0.7)),
    defesa: Math.round(defesaBase + modAgi + Math.floor(n * 0.4)),
    armadura: Math.max(0, Math.round(Math.floor(defesaBase * 0.3) + Math.floor(n * 0.2) + modTam.armadura)),
    esquiva: Math.min(30, Math.max(0, (modAgi * 3) + modTam.esquiva)),
    dano_base: monstro.dano_base || '1d6',
    xp: xpBase * n
  };
}

/**
 * Modificadores de combate por tamanho do monstro
 */
function _getModTamanho(tamanho) {
  return TAMANHO_MODS[tamanho] || TAMANHO_MODS.medio;
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
  // Cap: armadura reduz no maximo 75% do dano
  return Math.max(Math.ceil(dano * 0.25), dano - armadura);
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

  // Fallback: usar habilidade aleatoria ao inves de ataque basico
  return disponiveis[Math.floor(Math.random() * disponiveis.length)];
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

    // Encontrar monstro correspondente no banco (3 tentativas: exato, contém nome completo, primeiro nome)
    const nomeIA = sugestao.nome.toLowerCase().trim();
    const monstroBase = monstrosBanco.find(m => m.nome.toLowerCase() === nomeIA)
      || monstrosBanco.find(m => m.nome.toLowerCase().includes(nomeIA) || nomeIA.includes(m.nome.toLowerCase()))
      || monstrosBanco.find(m => {
        const palavras = nomeIA.split(' ');
        return palavras.length > 0 && m.nome.toLowerCase().startsWith(palavras[0]) && palavras[0].length >= 4;
      });

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
          forca: monstroBase.forca || 10,
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
          forca: 10 + Math.floor(nivelEfetivo * 0.5),
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
    return { finalizado: true, resultado: RESULTADO_COMBATE.VITORIA };
  }

  if (jogadoresVivos.length === 0) {
    return { finalizado: true, resultado: RESULTADO_COMBATE.DERROTA };
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
  const manaStr = jogadorHP?.mana_atual != null ? ` | Mana ${jogadorHP.mana_atual}/${jogadorHP.mana_max}` : '';
  const jogadorInfo = jogadorHP
    ? `HP ${jogadorHP.hp_atual}/${jogadorHP.hp_max}${manaStr} | Esquiva ${jogadorHP.esquiva || 0}% | Armadura ${jogadorHP.armadura || 0}`
    : 'HP desconhecido';

  // HP e status de todos os aliados (excluindo o jogador atual)
  const aliadosInfo = Object.entries(combateState.jogadores)
    .filter(([id]) => String(id) !== String(userId))
    .map(([_, j]) => {
      const efeitos = j.status_efeitos || [];
      const efeitosStr = efeitos.length > 0 ? ` [${efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')}]` : '';
      return `${j.personagemNome} HP ${j.hp_atual}/${j.hp_max}${efeitosStr}`;
    })
    .join(', ');

  // Status effects ativos do jogador atual
  const statusInfo = jogadorHP?.status_efeitos?.length
    ? jogadorHP.status_efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')
    : '';

  let contexto = `\n[COMBATE ATIVO - Rodada ${combateState.rodadaCombate}]`;
  contexto += `\n[Monstros vivos: ${monstrosInfo || 'nenhum'}]`;
  if (monstrosDerrotados) contexto += `\n[Monstros derrotados: ${monstrosDerrotados}]`;
  contexto += `\n[Seu status: ${jogadorInfo}]`;
  if (aliadosInfo) contexto += `\n[Aliados: ${aliadosInfo}]`;
  if (statusInfo) contexto += `\n[Seus efeitos: ${statusInfo}]`;

  // Habilidades disponíveis do jogador
  const jogadorCooldowns = jogadorHP?.cooldowns || {};
  if (combateState.habilidadesJogador?.length > 0) {
    const habsStr = combateState.habilidadesJogador
      .map(h => {
        const cd = jogadorCooldowns[h.id] || 0;
        const cdStr = cd > 0 ? ` [CD: ${cd}t]` : '';
        return `${h.nome} (${h.custo_mana}MP, ${h.tipo}${h.dano_base ? `, ${h.dano_base}` : ''}${cdStr})`;
      })
      .join(', ');
    contexto += `\n[Habilidades disponiveis: ${habsStr}]`;
  }

  return contexto;
}

/**
 * Resolve TODA a mecanica de combate de uma rodada ANTES da IA narrar.
 * Muta o estado do combate (HP, status, log, rodada) e retorna um resumo.
 * @param {Object} combate - Estado do combate
 * @param {string} userId - ID do jogador
 * @param {Object} sessao - Sessao completa
 * @param {Object} personagem - Dados do personagem
 * @param {Object|null} combatIntent - { tipo: 'atacar'|'defender'|'fugir'|'usar_habilidade', habilidadeId?, habilidadeNome? }
 */
export function resolverMecanicaCombate(combate, userId, sessao, personagem, combatIntent = null) {
  const intentTipo = combatIntent?.tipo || 'atacar';

  const resultados = {
    intentTipo,
    statusEfeitos: [],
    ataqueJogador: null,
    defesa: null,
    fuga: null,
    habilidade: null,
    contraAtaques: [],
    rodadaAvancou: false,
    combateFinalizado: false,
    resultadoCombate: null,
    statusRemovidos: [],
    jogadorDerrotado: false,
  };

  if (!combate?.ativo) return resultados;

  const jogadorStats = combate.jogadores[userId];
  if (!jogadorStats) return resultados;
  if (jogadorStats.status === 'derrotado') {
    resultados.jogadorDerrotado = true;
    return resultados;
  }

  // --- 1. STATUS EFFECTS DO JOGADOR ---
  const pcStatus = sessao.personagensCompletos?.[String(personagem.id)] || {};
  const statusEfeitos = pcStatus.status_efeitos || [];
  jogadorStats.status_efeitos = statusEfeitos;
  let impedidoDeAgir = false;

  for (const efeito of statusEfeitos) {
    if (STATUS_IMPEDE_ACAO.includes(efeito.nome)) {
      impedidoDeAgir = true;
      resultados.statusEfeitos.push({ tipo: 'impedido', efeito: efeito.nome, personagem: personagem.nome, userId });
    } else if (STATUS_DANO_POR_TURNO[efeito.nome]) {
      const danoPorTurno = rolarDado(STATUS_DANO_POR_TURNO[efeito.nome]);
      jogadorStats.hp_atual = Math.max(0, jogadorStats.hp_atual - danoPorTurno);
      if (jogadorStats.hp_atual <= 0 && jogadorStats.status === STATUS_COMBATENTE.VIVO) jogadorStats.status = STATUS_COMBATENTE.INCONSCIENTE;
      resultados.statusEfeitos.push({
        tipo: 'dano', efeito: efeito.nome, dano: danoPorTurno,
        hpRestante: jogadorStats.hp_atual, hpMax: jogadorStats.hp_max,
        personagem: personagem.nome, userId, personagemId: jogadorStats.personagemId,
        derrotado: jogadorStats.status === STATUS_COMBATENTE.DERROTADO,
      });
    }
  }

  // --- 2. ACAO DO JOGADOR (por intent) ---
  if (!impedidoDeAgir) {
    if (intentTipo === 'atacar') {
      resultados.ataqueJogador = _resolverAtaque(combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent);
    } else if (intentTipo === 'defender') {
      resultados.defesa = _resolverDefesa(combate, userId, personagem, jogadorStats);
    } else if (intentTipo === 'fugir') {
      resultados.fuga = _resolverFuga(combate, userId, sessao, personagem);
    } else if (intentTipo === 'usar_habilidade') {
      resultados.habilidade = _resolverHabilidade(combate, userId, sessao, personagem, jogadorStats, combatIntent);
    }
  }

  // Fuga bem-sucedida finaliza combate imediatamente
  if (resultados.fuga?.sucesso) {
    resultados.combateFinalizado = true;
    resultados.resultadoCombate = 'fuga';
    return resultados;
  }

  // --- 3. CONTRA-ATAQUE DOS MONSTROS ---
  const bonusEsquivaDefesa = (intentTipo === 'defender') ? 25 : 0;
  const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo');
  for (const monstro of monstrosVivos) {
    const jogadoresVivos = Object.entries(combate.jogadores).filter(([_, j]) => j.status === 'vivo');
    if (jogadoresVivos.length === 0) break;

    const [alvoId, alvoStats] = jogadoresVivos[Math.floor(Math.random() * jogadoresVivos.length)];
    const habilidade = selecionarHabilidadeMonstro(monstro, combate.rodadaCombate);
    const rolagemMonstro = Math.floor(Math.random() * 20) + 1;
    const { acertou: mAcertou, critico: mCritico } = verificarAcerto(rolagemMonstro);

    let danoMonstro = 0;
    let mEsquivou = false;
    if (mAcertou) {
      const esquivaExtra = (String(alvoId) === String(userId) && bonusEsquivaDefesa > 0) ? bonusEsquivaDefesa : 0;
      const esquivaEfetiva = Math.min(75, (alvoStats.esquiva || 0) + esquivaExtra);
      if (!mCritico && verificarEsquiva(esquivaEfetiva)) {
        mEsquivou = true;
      } else {
        const danoNotacao = habilidade?.dano || monstro.dano_base;
        const modForcaM = Math.floor(((monstro.forca || 10) - 10) / 2);
        danoMonstro = calcularDano(danoNotacao, modForcaM, mCritico, alvoStats.armadura || 0);
        if (String(alvoId) === String(userId) && intentTipo === 'defender') {
          danoMonstro = Math.max(1, Math.floor(danoMonstro * 0.5));
        }
        alvoStats.hp_atual = Math.max(0, alvoStats.hp_atual - danoMonstro);
        if (alvoStats.hp_atual <= 0 && alvoStats.status === 'vivo') alvoStats.status = 'inconsciente';
      }
    }

    if (habilidade) monstro.cooldowns[habilidade.nome] = combate.rodadaCombate;

    resultados.contraAtaques.push({
      atacante: monstro.nome, atacanteId: monstro.id,
      habilidade: habilidade?.nome || 'Ataque básico',
      alvoId, alvoNome: alvoStats.personagemNome,
      rolagem: rolagemMonstro,
      acertou: mAcertou && !mEsquivou, esquivou: mEsquivou, critico: mCritico,
      dano: danoMonstro, armaduraAlvo: alvoStats.armadura || 0,
      hpRestante: alvoStats.hp_atual, hpMax: alvoStats.hp_max,
      inconsciente: alvoStats.status === 'inconsciente',
      personagemId: alvoStats.personagemId,
    });
    combate.log.push({ tipo: 'ataque_monstro', ...resultados.contraAtaques.at(-1), timestamp: Date.now() });
  }

  // --- 4. CONTROLE DE RODADA ---
  if (!combate.jogadoresQueAgiram) combate.jogadoresQueAgiram = [];
  if (!combate.jogadoresQueAgiram.includes(userId)) combate.jogadoresQueAgiram.push(userId);

  const totalJogadoresVivos = Object.entries(combate.jogadores).filter(([_, j]) => j.status === 'vivo').length;
  if (combate.jogadoresQueAgiram.length >= totalJogadoresVivos) {
    combate.rodadaCombate++;
    combate.jogadoresQueAgiram = [];
    resultados.rodadaAvancou = true;

    for (const [jId, jStats] of Object.entries(combate.jogadores)) {
      const pCompleto = Object.values(sessao.personagensCompletos || {}).find(p => p.nome === jStats.personagemNome);
      if (!pCompleto?.status_efeitos) continue;
      pCompleto.status_efeitos = pCompleto.status_efeitos.filter(e => {
        e.duracao = (e.duracao || 1) - 1;
        if (e.duracao <= 0) {
          resultados.statusRemovidos.push({ personagem: jStats.personagemNome, userId: jId, status: e.nome, personagemId: jStats.personagemId });
          return false;
        }
        return true;
      });
    }
  }

  // --- 5. FIM DE COMBATE ---
  const { finalizado, resultado } = verificarFimCombate(combate);
  resultados.combateFinalizado = finalizado;
  resultados.resultadoCombate = resultado;

  return resultados;
}

/**
 * Resolve ataque basico do jogador contra primeiro monstro vivo
 */
function _resolverAtaque(combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent = null) {
  const alvoId = combatIntent?.alvoId;
  const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
    || combate.monstros.find(m => m.status === 'vivo');
  if (!monstroAlvo) return null;

  const pc = sessao.personagensCompletos?.[String(personagem.id)] || {};
  const attrs = pc.atributos || {};
  const modForca = Math.floor(((attrs.forca || 10) - 10) / 2);
  const bonusAtaqueEquip = jogadorStats.bonusAtaque || 0;
  const penalidadeCego = Object.entries(STATUS_PENALIDADE_ATAQUE)
    .reduce((acc, [nome, val]) => statusEfeitos.some(e => e.nome === nome) ? acc + val : acc, 0);
  const bonusAtaque = modForca + Math.floor((pc.nivel || 1) * 0.7) + bonusAtaqueEquip - penalidadeCego;

  const rolagemAtaque = Math.floor(Math.random() * 20) + 1;
  let { acertou, critico } = verificarAcerto(rolagemAtaque);
  if (acertou && !critico && penalidadeCego > 0 && (rolagemAtaque + bonusAtaque) < 10) {
    acertou = false;
  }

  let danoTotal = 0;
  let esquivou = false;
  if (acertou) {
    if (!critico && verificarEsquiva(monstroAlvo.esquiva || 0)) {
      esquivou = true;
    } else {
      const danoBase = jogadorStats.dano_base || (pc.nivel >= 5 ? '1d8' : '1d6');
      const bonusDanoEquip = jogadorStats.bonusDano || 0;
      danoTotal = calcularDano(danoBase, modForca + bonusDanoEquip, critico, monstroAlvo.armadura || 0);
      const elementoAtaque = jogadorStats.elemento || null;
      if (elementoAtaque) {
        danoTotal = aplicarResistencias(danoTotal, elementoAtaque, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
      }
      monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoTotal);
      if (monstroAlvo.hp_atual <= 0) monstroAlvo.status = 'derrotado';
    }
  }

  const result = {
    atacante: personagem.nome, userId,
    alvo: monstroAlvo.nome, alvoId: monstroAlvo.id,
    rolagem: rolagemAtaque, bonus: bonusAtaque,
    acertou: acertou && !esquivou, esquivou, critico,
    dano: danoTotal, armaduraAlvo: monstroAlvo.armadura || 0,
    hpRestante: monstroAlvo.hp_atual, hpMax: monstroAlvo.hp_max,
    derrotado: monstroAlvo.status === 'derrotado', xp: monstroAlvo.xp || 0,
  };
  combate.log.push({ tipo: 'ataque_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Resolve defesa: bonus de esquiva +25%, reducao de dano 50% nos contra-ataques
 */
function _resolverDefesa(combate, userId, personagem, jogadorStats) {
  const result = {
    personagem: personagem.nome,
    userId,
    esquivaBonus: 25,
    reducaoDano: 0.5,
    hpAtual: jogadorStats.hp_atual,
    hpMax: jogadorStats.hp_max,
  };
  combate.log.push({ tipo: 'defesa_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Resolve tentativa de fuga: teste de AGI vs DC baseada nos monstros vivos
 */
function _resolverFuga(combate, userId, sessao, personagem) {
  const pc = sessao.personagensCompletos?.[String(personagem.id)] || {};
  const attrs = pc.atributos || {};
  const modAgi = Math.floor(((attrs.agilidade || 10) - 10) / 2);

  const rolagem = Math.floor(Math.random() * 20) + 1;
  const total = rolagem + modAgi;
  const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo').length;
  const dc = 10 + (monstrosVivos * 2);
  const sucesso = total >= dc;

  const result = {
    personagem: personagem.nome,
    userId,
    rolagem,
    modificador: modAgi,
    total,
    dc,
    sucesso,
  };
  combate.log.push({ tipo: 'fuga_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Resolve uso de habilidade ativa em combate
 */
function _resolverHabilidade(combate, userId, sessao, personagem, jogadorStats, combatIntent) {
  const habilidadeId = combatIntent?.habilidadeId;
  const habilidadeNome = combatIntent?.habilidadeNome;

  const pc = sessao.personagensCompletos?.[String(personagem.id)] || {};
  const habilidades = pc.habilidades || pc.vantagens || [];
  const hab = habilidades.find(h => h.id === habilidadeId) || habilidades.find(h => h.nome === habilidadeNome);

  if (!hab) {
    log.warn({ userId, habilidadeId, habilidadeNome }, 'Habilidade nao encontrada no personagem');
    return { valido: false, erro: 'Habilidade nao encontrada' };
  }

  const validacao = processarHabilidade(hab, jogadorStats);
  if (!validacao.valido) {
    return validacao;
  }

  if (validacao.custoMana > 0) {
    jogadorStats.mana_atual = Math.max(0, (jogadorStats.mana_atual || 0) - validacao.custoMana);
  }
  if (validacao.cooldown > 0) {
    if (!jogadorStats.cooldowns) jogadorStats.cooldowns = {};
    jogadorStats.cooldowns[hab.id] = validacao.cooldown;
  }

  const alvoId = combatIntent?.alvoId;
  let ataqueHabilidade = null;
  let efeitoAplicado = null;
  const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
    || combate.monstros.find(m => m.status === 'vivo');

  if (validacao.dano > 0 && monstroAlvo) {
    let danoFinal = validacao.dano;
    const elementoHab = hab.elemento?.[0] || null;
    if (elementoHab) {
      danoFinal = aplicarResistencias(danoFinal, elementoHab, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
    }
    monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoFinal);
    if (monstroAlvo.hp_atual <= 0) monstroAlvo.status = 'derrotado';

    ataqueHabilidade = {
      alvo: monstroAlvo.nome, alvoId: monstroAlvo.id,
      dano: danoFinal, elemento: elementoHab,
      hpRestante: monstroAlvo.hp_atual, hpMax: monstroAlvo.hp_max,
      derrotado: monstroAlvo.status === 'derrotado', xp: monstroAlvo.xp || 0,
    };
  }

  // Auto-apply efeito da habilidade no alvo (ex: queimando, envenenado)
  if (validacao.efeito && monstroAlvo && monstroAlvo.status === 'vivo') {
    if (!monstroAlvo.status_efeitos) monstroAlvo.status_efeitos = [];
    const efNome = validacao.efeito.status || validacao.efeito.nome;
    if (efNome) {
      const existente = monstroAlvo.status_efeitos.find(e => e.nome === efNome);
      if (existente) {
        existente.duracao = validacao.efeito.duracao || 3;
      } else {
        monstroAlvo.status_efeitos.push({
          nome: efNome,
          duracao: validacao.efeito.duracao || 3,
          valor: validacao.efeito.valor || 0,
        });
      }
      efeitoAplicado = { status: efNome, duracao: validacao.efeito.duracao || 3, valor: validacao.efeito.valor || 0 };
      log.info({ alvo: monstroAlvo.nome, efeito: efNome, duracao: validacao.efeito.duracao }, 'Efeito de habilidade aplicado no monstro');
    }
  }

  const result = {
    valido: true,
    personagem: personagem.nome, userId,
    habilidadeNome: hab.nome, habilidadeId: hab.id,
    custoMana: validacao.custoMana || 0,
    cooldown: validacao.cooldown || 0,
    dano: validacao.dano,
    efeito: validacao.efeito,
    efeitoAplicado,
    ataque: ataqueHabilidade,
    manaRestante: jogadorStats.mana_atual,
    manaMax: jogadorStats.mana_max,
  };
  combate.log.push({ tipo: 'habilidade_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Formata os resultados mecanicos em texto para injetar no prompt da IA.
 */
export function formatarResultadoMecanico(resultados, personagemNome) {
  const linhas = ['[RESULTADO MECÂNICO DA RODADA — narre baseado nestes fatos, NÃO invente resultados diferentes]'];

  for (const se of resultados.statusEfeitos) {
    if (se.tipo === 'impedido') {
      linhas.push(`${personagemNome} está ${se.efeito} e não pode agir!`);
    } else if (se.tipo === 'dano') {
      linhas.push(`${personagemNome} sofreu ${se.dano} de dano por ${se.efeito}. HP: ${se.hpRestante}/${se.hpMax}`);
    }
  }

  // Ataque
  const atk = resultados.ataqueJogador;
  if (atk) {
    if (!atk.acertou && !atk.esquivou) {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem} — ERROU!`);
    } else if (atk.esquivou) {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem} (acertou) mas ${atk.alvo} ESQUIVOU!`);
    } else {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem}${atk.critico ? ' CRÍTICO!' : ''} — ${atk.dano} de dano. ${atk.alvo} HP: ${atk.hpRestante}/${atk.hpMax}${atk.derrotado ? ' — DERROTADO!' : ''}`);
    }
  }

  // Defesa
  if (resultados.defesa) {
    linhas.push(`${personagemNome} adotou postura defensiva! Esquiva +${resultados.defesa.esquivaBonus}%, dano recebido reduzido em 50%.`);
  }

  // Fuga
  if (resultados.fuga) {
    const f = resultados.fuga;
    if (f.sucesso) {
      linhas.push(`${personagemNome} tentou fugir: d20=${f.rolagem}+${f.modificador}=${f.total} vs DC ${f.dc} — FUGIU COM SUCESSO!`);
    } else {
      linhas.push(`${personagemNome} tentou fugir: d20=${f.rolagem}+${f.modificador}=${f.total} vs DC ${f.dc} — FALHOU! Não conseguiu escapar.`);
    }
  }

  // Habilidade
  if (resultados.habilidade) {
    const h = resultados.habilidade;
    if (h.valido === false) {
      linhas.push(`${personagemNome} tentou usar habilidade mas falhou: ${h.erro}`);
    } else {
      let habLine = `${personagemNome} usou ${h.habilidadeNome}!`;
      if (h.custoMana > 0) habLine += ` (-${h.custoMana} MP, restam ${h.manaRestante}/${h.manaMax})`;
      if (h.ataque) {
        habLine += ` ${h.ataque.dano} de dano em ${h.ataque.alvo}. HP: ${h.ataque.hpRestante}/${h.ataque.hpMax}${h.ataque.derrotado ? ' — DERROTADO!' : ''}`;
      }
      if (h.efeitoAplicado) {
        habLine += ` Efeito aplicado: ${h.efeitoAplicado.status} (${h.efeitoAplicado.duracao} turnos)`;
      }
      linhas.push(habLine);
    }
  }

  for (const ca of resultados.contraAtaques) {
    const atkName = ca.habilidade !== 'Ataque básico' ? `usou ${ca.habilidade} contra` : 'atacou';
    if (!ca.acertou && !ca.esquivou) {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem} — ERROU!`);
    } else if (ca.esquivou) {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem} (acertou) mas ${ca.alvoNome} ESQUIVOU!`);
    } else {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem}${ca.critico ? ' CRÍTICO!' : ''} — ${ca.dano} de dano. ${ca.alvoNome} HP: ${ca.hpRestante}/${ca.hpMax}${ca.inconsciente ? ' — INCONSCIENTE!' : ''}`);
    }
  }

  if (resultados.combateFinalizado) {
    const msg = resultados.resultadoCombate === 'fuga'
      ? 'COMBATE FINALIZADO: Os jogadores fugiram!'
      : resultados.resultadoCombate === RESULTADO_COMBATE.VITORIA
        ? 'COMBATE FINALIZADO: VITÓRIA dos jogadores!'
        : 'COMBATE FINALIZADO: DERROTA dos jogadores!';
    linhas.push(msg);
  }

  return '\n' + linhas.join('\n');
}

export default {
  rolarDado,
  calcularHP,
  calcularMana,
  processarHabilidade,
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
  formatarContextoCombate,
  resolverMecanicaCombate,
  formatarResultadoMecanico
};
