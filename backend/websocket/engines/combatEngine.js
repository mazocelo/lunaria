import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'combatEngine' });

import db from '../../Model/index.js';
import {
  calcularHP,
  calcularEsquiva,
  calcularArmadura,
  gerarInstanciasCombate,
  calcularMana,
  selecionarHabilidadeMonstro,
  verificarAcerto,
  calcularDano,
  calcularAbsorcao,
  calcularDCEsquiva,
  rolarDado,
  verificarFimCombate,
  avancarTurno,
  getMultRaca,
} from '../../helpers/combateHelper.js';
import { COMBAT_EVENTS } from '../events/eventTypes.js';
import { emitCombatActionResults, emitCombatState } from './combatEventEmitter.js';
import { verificarLevelUp, xpParaNivel } from '../../helpers/evolucaoHelper.js';
import { rolarLootCombate } from '../../helpers/lootHelper.js';
import { persistirEstadoClone } from '../../helpers/acoesProcessor.js';
import { ensurePersonagemBucket, registrarItemGanhoBucket } from '../../helpers/estadoTatico.js';
import {
  appendMensagemSessao
} from '../utils/sessionMessages.js';

export default class CombatEngine {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * Iniciar combate baseado na sinalização da IA
   * @param {string} roomId - ID da sala
   * @param {Object} combateData - Dados de combate da IA { monstros, motivo, dificuldade }
   * @param {Object} sessao - Sessão atual
   * @param {string} userId - ID do jogador que provocou o combate
   */
  async iniciarCombate(roomId, combateData, sessao, userId) {
    const sm = this.manager;

    try {
      log.warn({ roomId, motivo: combateData.motivo, monstrosIA: combateData.monstros }, 'COMBAT_INIT: inicio');

      const monstrosIA = combateData.monstros || [];
      const dificuldade = combateData.dificuldade || 'media';

      // Calcular nível médio dos jogadores
      // Always resolve full player objects from sessao.jogadores (sessao.jogadoresConectados is a string[] of userIds)
      const jogadores = Object.values(sessao.jogadores || {});
      log.warn({ jogadoresResolved: jogadores.map(j => ({ id: j.id, nome: j.nome, personagemId: j.personagemId })) }, 'COMBAT_INIT: jogadores resolved from sessao.jogadores');
      const personagensCompletos = sessao.personagensCompletos || {};

      log.warn({ jogadoresCount: jogadores.length, personagensKeys: Object.keys(personagensCompletos) }, 'COMBAT_INIT: jogadores');

      let somaLevels = 0;
      let countLevels = 0;
      for (const jogador of jogadores) {
        const pId = String(jogador.personagemId || jogador.personagem_id);
        const p = personagensCompletos[pId];
        if (p?.nivel) {
          somaLevels += p.nivel;
          countLevels++;
        }
      }
      const nivelMedio = countLevels > 0 ? Math.round(somaLevels / countLevels) : 1;

      // Buscar monstros no banco
      const monstrosBanco = [];
      for (const sugestao of monstrosIA) {
        log.warn({ nome: sugestao.nome }, 'COMBAT_INIT: buscando monstro');
        const encontrado = await db.Monstro.buscarPorNomeSimilar(sugestao.nome);
        log.warn({ nome: sugestao.nome, encontrado: !!encontrado, encontradoNome: encontrado?.nome }, 'COMBAT_INIT: resultado busca');
        if (encontrado) {
          monstrosBanco.push(encontrado);
        }
      }

      log.warn({ encontrados: monstrosBanco.length, total: monstrosIA.length }, 'COMBAT_INIT: monstros encontrados');

      // Gerar instâncias de combate
      const instancias = gerarInstanciasCombate(monstrosBanco, monstrosIA, nivelMedio);
      log.warn({ instancias: instancias.length }, 'COMBAT_INIT: instancias geradas');

      // Calcular HP/Esquiva/Armadura dos jogadores
      const jogadoresCombate = {};
      for (const jogador of jogadores) {
        const jUserId = String(jogador.userId || jogador.id);
        const pId = String(jogador.personagemId || jogador.personagem_id);
        const p = personagensCompletos[pId];

        if (p) {
          const attrs = p.atributos || {}; // já inclui bonus de raça/classe
          const bonusEquip = p.bonusEquip || {};
          const personagemStats = {
            constituicao: attrs.constituicao || 10,
            destreza: attrs.destreza || 10,
            agilidade: attrs.agilidade || 10,
            nivel: p.nivel || 1
          };
          const multRaca = getMultRaca(p.raca || p.raca_nome || '');
          const hpMax = calcularHP(personagemStats, multRaca);
          // Preservar HP da narrativa (dano de armadilhas, aplicar_dano, etc.)
          // sem reviver automaticamente personagens que ja estejam com 0 HP.
          const hpNarrativo = Number.isFinite(Number(p.hp_atual)) ? Number(p.hp_atual) : null;
          const hpAtual = (hpNarrativo != null && hpNarrativo < hpMax) ? Math.max(0, hpNarrativo) : hpMax;
          const manaMax = calcularMana({ inteligencia: attrs.inteligencia || 10, nivel: p.nivel || 1 });
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId),
            hp_max: hpMax,
            hp_atual: hpAtual,
            mana_max: manaMax,
            mana_atual: (p.mana_atual != null && p.mana_atual < manaMax) ? p.mana_atual : manaMax,
            esquiva: calcularEsquiva(personagemStats, bonusEquip),
            armadura: calcularArmadura(bonusEquip),
            bonusAtaque: Math.floor(((attrs.destreza || 10) - 10) / 2) + (bonusEquip.ataque || 0),
            bonusDano: bonusEquip.dano || 0,
            dano_base: p.melhorArma || (p.equipamentos?.length > 0 ? '1d6' : '1d6-1'),
            elemento: p.elementoArma || null,
            status: 'vivo',
            personagemNome: p.nome || jogador.personagemNome || jogador.nome || jogador.username || 'Jogador',
            cooldowns: {}
          };
        } else {
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId) || null,
            hp_max: 15,
            hp_atual: 15,
            mana_max: 10,
            mana_atual: 10,
            esquiva: 5,
            armadura: 0,
            bonusAtaque: 0,
            bonusDano: 0,
            dano_base: '1d6-1',
            status: 'vivo',
            personagemNome: jogador.personagemNome || jogador.nome || jogador.username || 'Jogador',
            cooldowns: {}
          };
        }
      }

      // Roll initiative for monsters (server-side)
      const iniciativaMonstros = [];
      for (const monstro of instancias) {
        const modBase = Math.floor(((monstro.forca || 10) - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        iniciativaMonstros.push({
          id: monstro.id,
          tipo: 'monstro',
          nome: monstro.nome,
          rolagem: roll,
          modificador: modBase,
          iniciativa: roll + modBase,
        });
      }

      // Montar estado de combate — aguardando iniciativa dos jogadores
      const combateState = {
        ativo: true,
        fase: 'iniciativa',  // aguardando jogadores rolarem iniciativa
        rodadaCombate: 0,
        motivo: combateData.motivo,
        dificuldade,
        monstros: instancias,
        jogadores: jogadoresCombate,
        jogadoresQueAgiram: [],
        iniciativaMonstros,
        iniciativaJogadores: {},  // preenchido quando jogadores rolam
        ordemIniciativa: [],
        turnoAtualIdx: 0,
        aguardandoAcao: null,
        log: [],
        resultado: null
      };

      log.warn({ monstros: iniciativaMonstros.map(m => ({ nome: m.nome, iniciativa: m.iniciativa })) }, 'COMBAT_INIT: iniciativa monstros (server-side)');

      // Salvar no estadoJogo
      const estadoJogo = sessao.estadoJogo || {};
      estadoJogo.combate = combateState;
      sessao.estadoJogo = estadoJogo;
      log.warn({ combateAtivo: combateState.ativo, monstrosCount: instancias.length, jogadoresCount: Object.keys(jogadoresCombate).length }, 'COMBAT_INIT: salvando no Redis');
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      log.warn({ monstros: instancias.length, jogadores: Object.keys(jogadoresCombate).length }, 'COMBAT_INIT: combate salvo com sucesso');

      // Snapshot forçado ao iniciar combate (garante estado persistido)
      sm._tentarSnapshot(roomId, sessao, true);

      // Emitir evento de combate iniciado
      // @event combate_iniciado → room (broadcast) | fires once when a new combat starts, sends monster instances and player stats
      sm.sendToRoom(roomId,COMBAT_EVENTS.COMBATE_INICIADO, {
        monstros: instancias,
        jogadores: jogadoresCombate,
        fase: 'iniciativa',
        iniciativaMonstros,
        rodada: 0,
        motivo: combateData.motivo,
        dificuldade,
        timestamp: Date.now()
      });

      log.warn('COMBAT_INIT: evento combate_iniciado emitido (fase: iniciativa)');

      // Solicitar dado de iniciativa para cada jogador
      for (const [jUserId, jogador] of Object.entries(jogadoresCombate)) {
        const pc = personagensCompletos[jogador.personagemId] || personagensCompletos[String(jogador.personagemId)] || {};
        const agiValue = pc.atributos?.agilidade || pc.agilidade || 10;
        const modAgi = Math.floor((agiValue - 10) / 2);

        // @event combate_solicita_iniciativa → room (broadcast) | requests initiative roll from player
        sm.sendToRoom(roomId, 'combate_solicita_iniciativa', {
          userId: jUserId,
          personagemNome: jogador.personagemNome,
          modificador: modAgi,
          atributo: 'Agilidade',
          timestamp: Date.now()
        });
        log.warn({ userId: jUserId, personagemNome: jogador.personagemNome, modAgi }, 'COMBAT_INIT: solicitando iniciativa do jogador');
      }

    } catch (error) {
      log.error({ err: error, roomId, stack: error.stack }, 'COMBAT_INIT: ERRO ao iniciar combate');
    }
  }

  /**
   * Process initiative roll from a player.
   * When all players have rolled, calculate order and start combat turns.
   */
  async processarIniciativaCombate(roomId, userId, valorDado, sessao) {
    const sm = this.manager;

    try {
      const combate = sessao.estadoJogo?.combate;
      if (!combate?.ativo || combate.fase !== 'iniciativa') {
        log.warn({ roomId, userId, fase: combate?.fase }, 'processarIniciativaCombate: não está na fase de iniciativa');
        return;
      }

      if (combate.iniciativaJogadores[userId]) {
        log.warn({ roomId, userId }, 'processarIniciativaCombate: jogador já rolou iniciativa');
        return;
      }

      // Get player's agility modifier
      const jogadorStats = combate.jogadores[userId];
      const personagensCompletos = sessao.personagensCompletos || {};
      const pc = personagensCompletos[jogadorStats?.personagemId] || personagensCompletos[String(jogadorStats?.personagemId)] || {};
      const agiValue = pc.atributos?.agilidade || pc.agilidade || 10;
      const modAgi = Math.floor((agiValue - 10) / 2);

      const roll = parseInt(valorDado, 10) || 1;
      combate.iniciativaJogadores[userId] = {
        id: userId,
        tipo: 'jogador',
        nome: jogadorStats?.personagemNome || 'Jogador',
        rolagem: roll,
        modificador: modAgi,
        iniciativa: roll + modAgi,
      };

      log.warn({ userId, roll, modAgi, iniciativa: roll + modAgi }, 'COMBAT_INIT: jogador rolou iniciativa');

      // Broadcast the roll result
      sm.sendToRoom(roomId, 'combate_resultado_iniciativa', {
        userId,
        personagemNome: jogadorStats?.personagemNome || 'Jogador',
        rolagem: roll,
        modificador: modAgi,
        iniciativa: roll + modAgi,
        timestamp: Date.now()
      });

      // Check if all players have rolled
      const jogadoresIds = Object.keys(combate.jogadores);
      const todosRolaram = jogadoresIds.every(id => combate.iniciativaJogadores[id]);

      if (!todosRolaram) {
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        return;
      }

      // All players rolled — define order
      const ordemIniciativa = [
        ...Object.values(combate.iniciativaJogadores),
        ...combate.iniciativaMonstros,
      ];

      ordemIniciativa.sort((a, b) => {
        if (b.iniciativa !== a.iniciativa) return b.iniciativa - a.iniciativa;
        if (a.tipo === 'jogador' && b.tipo === 'monstro') return -1;
        if (a.tipo === 'monstro' && b.tipo === 'jogador') return 1;
        return 0;
      });

      combate.ordemIniciativa = ordemIniciativa;
      combate.fase = 'combate';
      combate.rodadaCombate = 1;
      combate.turnoAtualIdx = 0;
      combate.aguardandoAcao = ordemIniciativa[0]?.id || null;

      log.warn({ ordemIniciativa: ordemIniciativa.map(o => ({ nome: o.nome, iniciativa: o.iniciativa })) }, 'COMBAT_INIT: ordem definida, combate começa');

      // @event combate_ordem_definida → room (broadcast) | initiative order finalized, combat begins
      sm.sendToRoom(roomId, 'combate_ordem_definida', {
        ordemIniciativa,
        primeiroTurno: ordemIniciativa[0],
        rodada: 1,
        timestamp: Date.now()
      });

      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      // If first turn is a monster, auto-execute
      if (ordemIniciativa[0]?.tipo === 'monstro') {
        const resultado = await this.executarTurnoMonstro(roomId, ordemIniciativa[0].id, sessao);
        if (resultado) {
          sm.sendToRoom(roomId, 'combat_monster_action', { ...resultado, timestamp: Date.now() });
          const fimCheck = verificarFimCombate(combate);
          if (fimCheck.finalizado) {
            await this.finalizarCombate(roomId, fimCheck.resultado);
            return;
          }
          // Advance to next turn
          const proximo = avancarTurno(combate);
          if (proximo) {
            sm.sendToRoom(roomId, 'combat_turn', { turnoAtual: proximo, rodada: combate.rodadaCombate, timestamp: Date.now() });
          }
        }
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      }

    } catch (error) {
      log.error({ err: error, roomId, userId, stack: error.stack }, 'processarIniciativaCombate: ERRO');
    }
  }

  /**
   * Processar ação de combate de um jogador
   */
  async processarAcaoCombate(roomId, userId, username, personagem, mensagem, respostaIA, sessao) {
    const sm = this.manager;

    try {
      const estadoJogo = sessao.estadoJogo || {};
      const combate = estadoJogo.combate;
      if (!combate?.ativo) return;
      if (combate.fase === 'iniciativa') {
        log.warn({ roomId, userId }, 'processarAcaoCombate: aguardando iniciativa, ignorando ação');
        return;
      }

      // ✅ Usar resultados pré-resolvidos (mecânica já foi computada ANTES da IA narrar)
      const r = sessao._combatePreResolvido;
      if (!r) {
        log.warn({ roomId, userId }, 'processarAcaoCombate: sem resultados pre-resolvidos, pulando');
        return;
      }
      delete sessao._combatePreResolvido;

      // Jogador derrotado
      if (r.jogadorDerrotado) {
        // @event server_message → room (broadcast) | fires when a defeated player tries to act in combat
        sm.sendToRoom(roomId,'server_message', {
          userId,
          mensagem: `💀 ${personagem.nome} foi derrotado e não pode agir neste combate.`
        });
        return;
      }

      // Registrar ação no log de combate
      if (!Array.isArray(combate.log)) combate.log = [];
      combate.log.push({
        userId,
        personagem: personagem?.nome,
        tipo: r.tipo || 'acao',
        danoTotal: r.danoTotal || 0,
        alvos: r.alvosAtingidos?.map(a => a.nome) || [],
        sucesso: r.sucesso ?? null,
        timestamp: new Date().toISOString()
      });

      // Emitir todos os eventos de resultado de ação via emitter centralizado
      await emitCombatActionResults(sm, roomId, r, sessao, { userId, personagem });

      // Verificar fim de combate
      log.warn({ combateFinalizado: r.combateFinalizado, resultadoCombate: r.resultadoCombate, monstrosHP: combate.monstros?.map(m => ({ nome: m.nome, hp: m.hp_atual, status: m.status })) }, 'processarAcaoCombate: verificando fim');
      if (r.combateFinalizado) {
        log.warn({ resultado: r.resultadoCombate }, 'processarAcaoCombate: FINALIZANDO COMBATE');
        await this.finalizarCombate(roomId, r.resultadoCombate);
        return;
      }

      // Advance initiative turn and process consecutive monster turns
      if (combate.ordemIniciativa?.length) {
        // Emit current player's turn result, then advance
        let turnoAvancado = false;
        while (true) {
          const proximo = avancarTurno(combate);
          if (!proximo) break;

          if (proximo.tipo === 'jogador') {
            // Next is a player — emit turn info and stop
            sm.sendToRoom(roomId, 'combat_turn', {
              turnoAtual: proximo,
              rodada: combate.rodadaCombate,
              timestamp: Date.now()
            });
            turnoAvancado = true;
            break;
          }

          // Monster turn — execute automatically
          sm.sendToRoom(roomId, 'combat_turn', {
            turnoAtual: proximo,
            rodada: combate.rodadaCombate,
            timestamp: Date.now()
          });

          const resultadoMonstro = await this.executarTurnoMonstro(roomId, proximo.id, sessao);
          if (resultadoMonstro) {
            sm.sendToRoom(roomId, 'combat_monster_action', {
              ...resultadoMonstro,
              timestamp: Date.now()
            });

            const fimCheck = verificarFimCombate(combate);
            if (fimCheck.finalizado) {
              sessao.estadoJogo = estadoJogo;
              await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
              await this.finalizarCombate(roomId, fimCheck.resultado);
              return;
            }
          }
          turnoAvancado = true;
        }
      }

      // Salvar estado atualizado no Redis
      sessao.estadoJogo = estadoJogo;
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      // Emitir estado atualizado
      emitCombatState(sm, roomId, combate);

    } catch (error) {
      log.error({ err: error, roomId, userId }, 'Erro ao processar acao de combate');
    }
  }

  /**
   * Execute a monster's turn automatically.
   * Called when initiative order reaches a monster.
   */
  async executarTurnoMonstro(roomId, monstroId, sessao) {
    const combate = sessao.estadoJogo?.combate;
    if (!combate?.ativo) return null;

    const monstro = combate.monstros.find(m => m.id === monstroId && m.status === 'vivo');
    if (!monstro) return null;

    // Pick target: random living player
    const jogadoresVivos = Object.entries(combate.jogadores)
      .filter(([_, j]) => j.status === 'vivo');
    if (jogadoresVivos.length === 0) return null;

    const [alvoId, alvoStats] = jogadoresVivos[Math.floor(Math.random() * jogadoresVivos.length)];

    // Pick ability or basic attack
    const habilidade = selecionarHabilidadeMonstro(monstro, combate.rodadaCombate);

    // Roll attack: d20 + modDEX + bonusNivel vs DC = 8 + target's modAGI
    const rolagem = Math.floor(Math.random() * 20) + 1;
    const modDEX = Math.floor(((monstro.destreza || 10) - 10) / 2);
    const bonusNivel = Math.floor(((monstro.nivel || 1)) / 2);
    const bonusAtaqueMonstro = modDEX + bonusNivel;
    const totalAtaque = rolagem + bonusAtaqueMonstro;

    // Target's dodge DC from AGI
    const personagensCompletos = sessao?.personagensCompletos || {};
    const pcId = alvoStats.personagemId;
    const pc = personagensCompletos[pcId] || personagensCompletos[String(pcId)] || {};
    const agiValue = pc.atributos?.agilidade || pc.agilidade || 10;
    const dcEsquiva = 8 + Math.floor((agiValue - 10) / 2);

    const { acertou, critico } = verificarAcerto(rolagem, totalAtaque, dcEsquiva);

    let dano = 0;
    let esquivou = false;

    log.warn({ monstroNome: monstro.nome, alvoNome: alvoStats.personagemNome, rolagem, bonusAtaque: bonusAtaqueMonstro, totalAtaque, dcEsquiva, acertou, critico, dano_base: monstro.dano_base, habilidadeNome: habilidade?.nome, habilidadeDano: habilidade?.dano }, 'MONSTER_TURN: attack roll');

    if (acertou) {
      // DC esquiva já foi verificado por verificarAcerto — sem checagem % adicional.
      const defesaTemp = alvoStats.defesaTemporaria;

      if (!esquivou) {
        const danoBase = habilidade?.dano || monstro.dano_base || '1d6';
        const modForca = Math.floor(((monstro.forca || 10) - 10) / 2);
        // calcularDano rola o dado internamente — passar notacao, nao valor rolado
        dano = calcularDano(danoBase, modForca, critico);

        // Absorption: max(0, modCON-1)d4 + armadura — crits ignore absorption
        let absorcao = 0;
        if (!critico) {
          const conAlvo = pc.atributos?.constituicao || pc.constituicao || alvoStats.constituicao || 10;
          absorcao = calcularAbsorcao(conAlvo, alvoStats.armadura || 0);
          dano = Math.max(0, dano - absorcao);
        }

        log.warn({ danoBase, danoFinal: dano, modForca, critico, absorcao }, 'MONSTER_TURN: damage calc');

        // Apply damage reduction from defense
        if (defesaTemp?.reducaoDano) {
          dano = Math.max(1, Math.floor(dano * (1 - defesaTemp.reducaoDano)));
        }

        alvoStats.hp_atual = Math.max(0, alvoStats.hp_atual - dano);
        if (alvoStats.hp_atual <= 0) {
          alvoStats.status = 'inconsciente';
        }
        log.warn({ dano, hpRestante: alvoStats.hp_atual, status: alvoStats.status }, 'MONSTER_TURN: damage applied');
      }
    }

    const resultado = {
      atacanteId: monstro.id,
      atacanteNome: monstro.nome,
      habilidade: habilidade?.nome || 'Ataque básico',
      alvoId,
      alvoNome: alvoStats.personagemNome,
      rolagem,
      bonusAtaque: bonusAtaqueMonstro,
      totalAtaque,
      dcEsquiva,
      acertou: acertou && !esquivou,
      esquivou,
      critico,
      dano,
      hpRestante: alvoStats.hp_atual,
      hpMax: alvoStats.hp_max,
    };

    // Log
    if (!Array.isArray(combate.log)) combate.log = [];
    combate.log.push({ tipo: 'ataque_monstro', ...resultado, timestamp: Date.now() });

    log.warn({ monstroId, alvoId, dano, acertou: resultado.acertou, critico }, 'COMBAT_MONSTER_TURN: ataque executado');

    return resultado;
  }

  /**
   * Finalizar combate
   * @param {string} roomId - ID da sala
   * @param {string} resultado - 'vitoria' | 'derrota' | 'fuga'
   */
  async finalizarCombate(roomId, resultado) {
    const sm = this.manager;

    try {
      log.info({ roomId, resultado }, 'Finalizando combate');

      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) return;

      const estadoJogo = sessao.estadoJogo || {};
      const combate = estadoJogo.combate;
      if (!combate) return;

      // Calcular XP total
      let xpTotal = 0;
      if (resultado === 'vitoria') {
        xpTotal = combate.monstros
          .filter(m => m.status === 'derrotado')
          .reduce((total, m) => total + (m.xp || 0), 0);
      }

      // Desativar combate
      combate.ativo = false;
      combate.resultado = resultado;

      // Tratamento de derrota: marcar jogadores inconscientes e verificar fim de sessão
      if (resultado === 'derrota') {
        for (const [uid, jogador] of Object.entries(combate.jogadores || {})) {
          if (jogador.status === 'inconsciente' || jogador.hp_atual <= 0) {
            jogador.status = 'derrotado';

            // @event jogador_derrotado → room (broadcast) | fires for each defeated/unconscious player when combat ends in defeat
            sm.sendToRoom(roomId, 'jogador_derrotado', {
              userId: uid,
              personagemNome: jogador.personagemNome,
              mensagem: `${jogador.personagemNome} foi derrotado em combate.`,
              timestamp: Date.now()
            });
          }
        }

        // Verificar se algum jogador ainda está vivo na sessão
        const jogadoresVivos = Object.values(sessao.jogadores || {}).filter(j => {
          const combatStats = combate.jogadores?.[j.id || j.personagemId];
          return !combatStats || combatStats.status === 'vivo';
        });

        if (jogadoresVivos.length === 0) {
          log.warn({ roomId }, 'Todos jogadores derrotados — encerrando sessao');
          // @event sessao_encerrada → room (broadcast) | fires when all players are defeated and no living players remain in the session
          sm.sendToRoom(roomId, 'sessao_encerrada', {
            motivo: 'derrota_total',
            mensagem: 'Todos os aventureiros caíram. A sessão foi encerrada.',
            timestamp: Date.now()
          });
        }
      }

      sessao.estadoJogo = estadoJogo;
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      log.info({ roomId, resultado, xpTotal }, 'Combate finalizado');

      // Persistir HP final de todos os jogadores no clone (vivos e derrotados)
      for (const [jId, jStats] of Object.entries(combate.jogadores)) {
        if (jStats.personagemId) {
          await persistirEstadoClone(roomId, jStats.personagemId, { hp_atual: jStats.hp_atual });
        }
      }

      // Persistir XP no clone da sessão (não no personagem original)
      const xpPorJogador = xpTotal > 0
        ? Math.floor(xpTotal / Math.max(1, Object.values(combate.jogadores).filter(j => j.status === 'vivo').length))
        : 0;

      if (xpTotal > 0) {
        try {
          const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);

          for (const [jUserId, jogadorCombate] of Object.entries(combate.jogadores)) {
            if (jogadorCombate.status !== 'vivo') continue;
            if (!jogadorCombate.personagemId) continue;

            // Tentar gravar no clone primeiro
            let gravouNoClone = false;
            if (sessaoJogoRow) {
              const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
                sessaoJogoRow.id, jogadorCombate.personagemId
              );
              if (clone) {
                const xpTotalClone = (clone.xp_inicio + clone.xp_ganho) + xpPorJogador;
                let nivelAtual = clone.nivel_fim || clone.nivel_inicio;

                // Multi-level-up loop
                let xpRestante = xpTotalClone;
                let levelUp = verificarLevelUp(nivelAtual, xpRestante);
                while (levelUp.podeEvoluir) {
                  nivelAtual = levelUp.ganhos.novoNivel;
                  xpRestante = levelUp.ganhos.xpRestante;

                  // @event level_up → room (broadcast) | fires for each level gained via clone path when combat XP causes one or more level-ups
                  sm.sendToRoom(roomId,'level_up', {
                    userId: jUserId,
                    personagemNome: jogadorCombate.personagemNome,
                    novoNivel: nivelAtual,
                    ganhos: levelUp.ganhos,
                    timestamp: Date.now()
                  });
                  log.info({ personagem: jogadorCombate.personagemNome, novoNivel: nivelAtual }, 'Level up!');

                  // Post automático no feed
                  db.FeedPost.createAutoEvent(parseInt(jUserId), 'level_up', { personagem: jogadorCombate.personagemNome, nivel: nivelAtual }, 'personagem', jogadorCombate.personagemId).catch(() => {});

                  levelUp = verificarLevelUp(nivelAtual, xpRestante);
                }

                await db.PersonagemSessao.atualizarRuntime(clone.id, {
                  xp_ganho: clone.xp_ganho + xpPorJogador,
                  nivel_fim: nivelAtual
                });
                gravouNoClone = true;

                // Bucket runtime — acumula XP para state block do próximo turno
                const bucketXp = ensurePersonagemBucket(sessao, jUserId);
                bucketXp.xp_ganho = (bucketXp.xp_ganho || 0) + xpPorJogador;
              }
            }

            // Fallback: se não tem clone, gravar direto no personagem
            if (!gravouNoClone) {
              const personagem = await db.prisma.personagens.findUnique({
                where: { id: jogadorCombate.personagemId },
                select: { id: true, nivel: true, xp_atual: true, xp_proximo_nivel: true, pontos_atributo_pendentes: true }
              });
              if (!personagem) continue;

              let nivelAtual = personagem.nivel || 1;
              let xpRestante = (personagem.xp_atual || 0) + xpPorJogador;
              let pontosAtributoExtra = 0;
              let ultimoGanhos = null;

              let levelUp = verificarLevelUp(nivelAtual, xpRestante);
              while (levelUp.podeEvoluir) {
                pontosAtributoExtra += levelUp.ganhos.pontosAtributo;
                ultimoGanhos = levelUp.ganhos;
                nivelAtual = levelUp.ganhos.novoNivel;
                xpRestante = levelUp.ganhos.xpRestante;
                levelUp = verificarLevelUp(nivelAtual, xpRestante);
              }

              if (ultimoGanhos) {
                await db.prisma.personagens.update({
                  where: { id: jogadorCombate.personagemId },
                  data: {
                    xp_atual: xpRestante,
                    xp_proximo_nivel: xpParaNivel(nivelAtual),
                    nivel: nivelAtual,
                    pontos_atributo_pendentes: (personagem.pontos_atributo_pendentes || 0) + pontosAtributoExtra,
                    atualizado_em: new Date()
                  }
                });

                // @event level_up → room (broadcast) | fires when combat XP causes a level-up via fallback direct-write path (no clone)
                sm.sendToRoom(roomId,'level_up', {
                  userId: jUserId,
                  personagemNome: jogadorCombate.personagemNome,
                  novoNivel: nivelAtual,
                  ganhos: ultimoGanhos,
                  timestamp: Date.now()
                });

                // Post automático no feed
                db.FeedPost.createAutoEvent(parseInt(jUserId), 'level_up', { personagem: jogadorCombate.personagemNome, nivel: nivelAtual }, 'personagem', jogadorCombate.personagemId).catch(() => {});
              } else {
                await db.prisma.personagens.update({
                  where: { id: jogadorCombate.personagemId },
                  data: { xp_atual: xpRestante, atualizado_em: new Date() }
                });
              }

              // Bucket runtime — fallback path (sem clone)
              const bucketXpFb = ensurePersonagemBucket(sessao, jUserId);
              bucketXpFb.xp_ganho = (bucketXpFb.xp_ganho || 0) + xpPorJogador;
            }
          }

          log.info({ xpPorJogador }, 'XP persistido por jogador sobrevivente');
        } catch (errXP) {
          log.error({ err: errXP }, 'Erro ao persistir XP no banco');
        }
      }

      // Loot automático (se vitória e monstros têm loot table)
      let lootResultado = null;
      if (resultado === 'vitoria') {
        try {
          const monstrosDerrotados = combate.monstros
            .filter(m => m.status === 'derrotado' && m.monstroId)
            .map(m => ({ monstroDbId: m.monstroId, nome: m.nome }));

          const jogadoresSobreviventes = Object.entries(combate.jogadores)
            .filter(([_, j]) => j.status === 'vivo')
            .map(([uid, j]) => ({ userId: uid, nome: j.personagemNome, personagemId: j.personagemId }));

          const nivelMedio = jogadoresSobreviventes.length > 0
            ? Math.round(Object.values(combate.jogadores)
                .filter(j => j.status === 'vivo')
                .reduce((sum, j) => sum + (j.nivel || 1), 0) / jogadoresSobreviventes.length)
            : 1;

          if (monstrosDerrotados.length > 0 && jogadoresSobreviventes.length > 0) {
            lootResultado = await rolarLootCombate(monstrosDerrotados, jogadoresSobreviventes, nivelMedio);

            if (lootResultado && lootResultado.todosItens.length > 0) {
              // Persistir loot nos clones
              const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
              if (sessaoJogoRow) {
                for (const [uid, items] of Object.entries(lootResultado.lootPorJogador)) {
                  const jogadorCombate = combate.jogadores[uid];
                  if (!jogadorCombate?.personagemId) continue;
                  const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
                    sessaoJogoRow.id, jogadorCombate.personagemId
                  );
                  if (clone) {
                    for (const item of items) {
                      await db.PersonagemSessao.registrarItemGanho(clone.id, {
                        equipamento_id: item.equipamento_id,
                        nome: item.nome,
                        origem: 'loot'
                      });
                    }
                  }
                }
              }

              // Bucket runtime — loot para state block (independente de clone/sessaoJogoRow)
              for (const [uid, items] of Object.entries(lootResultado.lootPorJogador)) {
                for (const item of items) {
                  registrarItemGanhoBucket(sessao, uid, { nome: item.nome, id: item.equipamento_id || null });
                }
              }

              // @event combate_loot → room (broadcast) | fires after victory when defeated monsters drop one or more items
              sm.sendToRoom(roomId,'combate_loot', {
                lootPorJogador: lootResultado.lootPorJogador,
                todosItens: lootResultado.todosItens,
                timestamp: Date.now()
              });
            }
          }
        } catch (errLoot) {
          log.error({ err: errLoot }, 'Erro ao rolar loot');
        }
      }

      // Emitir evento de combate finalizado
      const monstrosDerrotados = combate.monstros.filter(m => m.status === 'derrotado').map(m => m.nome);
      // @event combate_finalizado → room (broadcast) | fires once when combat ends (vitoria/derrota/fuga), carrying XP, survivors and loot summary
      sm.sendToRoom(roomId,COMBAT_EVENTS.COMBATE_FINALIZADO, {
        resultado,
        xpTotal,
        xpPorJogador,
        monstrosDerrotados,
        jogadoresSobreviventes: Object.entries(combate.jogadores)
          .filter(([, j]) => j.status === 'vivo')
          .map(([uid, j]) => ({ userId: uid, nome: j.personagemNome, hp_atual: j.hp_atual })),
        loot: lootResultado?.todosItens || [],
        timestamp: Date.now()
      });

      // Posts automáticos no feed para sobreviventes
      if (resultado === 'vitoria') {
        for (const [uid, j] of Object.entries(combate.jogadores)) {
          if (j.status === 'vivo') {
            db.FeedPost.createAutoEvent(parseInt(uid), 'combate_finalizado', { resultado, monstros: monstrosDerrotados, xpGanho: xpPorJogador }, 'personagem', j.personagemId).catch(() => {});
          }
        }
      }

      // Narrar desfecho via IA
      try {
        const mestre = await sm.obterMestre(roomId, sessao.historiaTemas || [], sessao, null);
        const desfecho = resultado === 'vitoria'
          ? `Os monstros foram derrotados! Os jogadores ganham ${xpTotal} XP. Narre o desfecho da batalha de forma épica.`
          : resultado === 'derrota'
            ? `Os jogadores foram derrotados em combate. Narre a consequência dessa derrota de forma dramática, mas não mate os personagens.`
            : `Os jogadores fugiram do combate. Narre a fuga de forma tensa.`;

        const respostaDesfecho = await mestre.narrarAcao({
          jogador: 'Sistema',
          personagem: 'Narrador',
          acao: desfecho,
          chatHistory: sessao.mensagens || [],
          resumo: null,
          runtimeOptions: {
            historiaConfig: sessao.historiaConfig || null
          }
        });

        // Emitir e salvar narração do desfecho
        const msgDesfecho = sm.criarMensagemMestre(respostaDesfecho.narracao, sessao.mestreConfig, {
          sessao,
          segmentos: respostaDesfecho.segmentos || []
        });
        appendMensagemSessao(sessao, msgDesfecho);
        await sm.aplicarMetadadosNarrativos(roomId, sessao, respostaDesfecho.metadados || {});

        // @event mensagem_mestre → room (broadcast) | fires after combat ends with the AI-narrated epilogue (victory, defeat or escape)
        sm.sendToRoom(roomId,'mensagem_mestre', {
          id: Date.now().toString(),
          ...msgDesfecho,
          message: respostaDesfecho.narracao
        });
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        await sm.executarCompactacaoSeNecessaria(roomId, sessao, {});

      } catch (errIA) {
        log.error({ err: errIA }, 'Erro ao narrar desfecho do combate');
      }

      // Snapshot forçado ao finalizar combate
      sm._tentarSnapshot(roomId, sessao, true);

    } catch (error) {
      log.error({ err: error, roomId }, 'Erro ao finalizar combate');
    }
  }
}
