/**
 * Combat Event Emitter — emite eventos de combate extraídos de processarAcaoCombate.
 * Centraliza emissão de combate_resultado_acao, combate_jogador_ferido,
 * combate_monstro_derrotado, combate_estado e persistência de HP.
 */
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'combatEventEmitter' });

import { COMBAT_EVENTS } from '../events/eventTypes.js';
import { persistirEstadoClone } from '../../helpers/acoesProcessor.js';

/**
 * Emite todos os eventos de resultado de ação de combate.
 * Extrai a lógica inline de combatEngine.processarAcaoCombate.
 *
 * @param {object} sm - socketManager
 * @param {string} roomId
 * @param {object} r - resultados pré-resolvidos (sessao._combatePreResolvido)
 * @param {object} sessao
 * @param {{ userId: string, personagem: { nome: string } }} ctx - contexto do jogador
 */
export async function emitCombatActionResults(sm, roomId, r, sessao, ctx) {
  const { userId, personagem } = ctx;

  // --- Status effects do jogador (impedido, DOT) ---
  for (const se of (r.statusEfeitos || [])) {
    if (se.tipo === 'impedido') {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
        tipo: 'status_efeito', personagem: se.personagem, userId: se.userId,
        status: se.efeito, mensagem: `${se.personagem} está ${se.efeito} e não pode agir!`,
        timestamp: Date.now()
      });
    } else if (se.tipo === 'dano') {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
        tipo: 'status_dano', alvo: { userId: se.userId, nome: se.personagem },
        status: se.efeito, dano: se.dano, hpRestante: se.hpRestante, hpMax: se.hpMax,
        timestamp: Date.now()
      });
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
        userId: se.userId, nome: se.personagem,
        hp_atual: se.hpRestante, hp_max: se.hpMax,
        derrotado: se.derrotado, fonte: se.efeito, timestamp: Date.now()
      });
      if (se.personagemId) {
        await persistirEstadoClone(roomId, se.personagemId, { hp_atual: se.hpRestante });
      }
    }
  }

  // --- Ação do jogador: ataque ---
  const atk = r.ataqueJogador;
  if (atk) {
    sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
      tipo: 'ataque_jogador',
      atacante: { userId: atk.userId, nome: atk.atacante },
      alvo: { id: atk.alvoId, nome: atk.alvo },
      rolagem: atk.rolagem, bonus: atk.bonus,
      acertou: atk.acertou, esquivou: atk.esquivou, critico: atk.critico,
      dano: atk.dano, armaduraAlvo: atk.armaduraAlvo,
      hpRestante: atk.hpRestante, hpMax: atk.hpMax,
      timestamp: Date.now()
    });
    if (atk.derrotado) {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_MONSTRO_DERROTADO, {
        monstro: { id: atk.alvoId, nome: atk.alvo },
        xp: atk.xp, timestamp: Date.now()
      });
    }
  }

  // --- Ação do jogador: defesa ---
  if (r.defesa) {
    sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
      tipo: 'defesa_jogador',
      personagem: r.defesa.personagem, userId: r.defesa.userId,
      esquivaBonus: r.defesa.esquivaBonus, reducaoDano: r.defesa.reducaoDano,
      hpAtual: r.defesa.hpAtual, hpMax: r.defesa.hpMax,
      timestamp: Date.now()
    });
  }

  // --- Ação do jogador: fuga ---
  if (r.fuga) {
    sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
      tipo: 'fuga_jogador',
      personagem: r.fuga.personagem, userId: r.fuga.userId,
      rolagem: r.fuga.rolagem, modificador: r.fuga.modificador,
      total: r.fuga.total, dc: r.fuga.dc, sucesso: r.fuga.sucesso,
      timestamp: Date.now()
    });
  }

  // --- Ação do jogador: habilidade ---
  if (r.habilidade) {
    const h = r.habilidade;
    sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
      tipo: h.valido === false ? 'habilidade_falhou' : h.testeFalhou ? 'habilidade_teste_falhou' : 'habilidade_jogador',
      personagem: h.personagem || personagem.nome, userId: h.userId || userId,
      habilidadeNome: h.habilidadeNome, habilidadeId: h.habilidadeId,
      valido: h.valido, erro: h.erro || null,
      custoMana: h.custoMana, manaRestante: h.manaRestante, manaMax: h.manaMax,
      dano: h.dano, efeito: h.efeito, efeitoAplicado: h.efeitoAplicado || null,
      ataque: h.ataque || null,
      timestamp: Date.now()
    });
    if (h.ataque?.derrotado) {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_MONSTRO_DERROTADO, {
        monstro: { id: h.ataque.alvoId, nome: h.ataque.alvo },
        xp: h.ataque.xp, timestamp: Date.now()
      });
    }
  }

  // --- Contra-ataques dos monstros ---
  for (const ca of (r.contraAtaques || [])) {
    sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
      tipo: 'ataque_monstro',
      atacante: { id: ca.atacanteId, nome: ca.atacante },
      alvo: { userId: ca.alvoId, nome: ca.alvoNome },
      habilidade: ca.habilidade,
      rolagem: ca.rolagem,
      acertou: ca.acertou, esquivou: ca.esquivou, critico: ca.critico,
      dano: ca.dano, armaduraAlvo: ca.armaduraAlvo,
      hpRestante: ca.hpRestante, hpMax: ca.hpMax,
      timestamp: Date.now()
    });
    if (ca.acertou && ca.dano > 0) {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
        userId: ca.alvoId, nome: ca.alvoNome,
        hp_atual: ca.hpRestante, hp_max: ca.hpMax,
        derrotado: ca.inconsciente || false,
        timestamp: Date.now()
      });
    }
    if (ca.personagemId && ca.dano > 0) {
      await persistirEstadoClone(roomId, ca.personagemId, { hp_atual: ca.hpRestante });
    }
  }

  // --- Status removidos ---
  for (const sr of (r.statusRemovidos || [])) {
    sm.emitirAcaoMestrePersistida(roomId, sessao, {
      tipo: 'status_removido', personagem: sr.personagem,
      userId: sr.userId, status: sr.status, timestamp: Date.now()
    });
    if (sr.personagemId) {
      const pCompleto = Object.values(sessao.personagensCompletos || {}).find(p => p.nome === sr.personagem);
      if (pCompleto) {
        await persistirEstadoClone(roomId, sr.personagemId, { status_efeitos: pCompleto.status_efeitos });
      }
    }
  }

  // --- Efeitos em monstros (DOT + remoção) ---
  for (const se of (r.statusEfeitosMonstro || [])) {
    if (se.tipo === 'dano') {
      sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
        tipo: 'status_dano',
        alvo: { id: se.monstroId, nome: se.monstroNome },
        status: se.efeito, dano: se.dano,
        hpRestante: se.hpRestante, hpMax: se.hpMax,
        timestamp: Date.now()
      });
    }
  }

  if (r.rodadaAvancou) {
    log.info({ roomId, rodadaCombate: sessao.estadoJogo?.combate?.rodadaCombate }, 'Combate avancou rodada');
  }
}

/**
 * Emite combate_estado com o snapshot atual do combate.
 */
export function emitCombatState(sm, roomId, combate) {
  sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_ESTADO, {
    monstros: combate.monstros,
    jogadores: combate.jogadores,
    rodada: combate.rodadaCombate,
    log: combate.log.slice(-5),
    timestamp: Date.now()
  });
}
