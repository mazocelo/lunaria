/**
 * Canonical invariant validation engine for Lunaria RPG.
 *
 * Every exported function has the signature:
 *   (log, cenario) => { ok: boolean, falhas: string[] }
 *
 * `ok` is always derived from `falhas.length === 0`.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function result(falhas) {
  return { ok: falhas.length === 0, falhas };
}

/**
 * Iterate estadoAntes/estadoApos for every turno, calling `checkFn` with
 * (label, state, turnoIndex).  `checkFn` should return an array of failure
 * strings (empty when ok).
 */
function forEachState(log, checkFn) {
  const falhas = [];
  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    for (const phase of ['estadoAntes', 'estadoApos']) {
      const state = t[phase];
      if (!state) continue;
      const label = `turno ${i + 1} ${phase}`;
      falhas.push(...checkFn(label, state, i));
    }
  }
  return falhas;
}

// ---------------------------------------------------------------------------
// 1. resposta_ia_parseavel
// ---------------------------------------------------------------------------

export function resposta_ia_parseavel(log, _cenario) {
  const falhas = [];
  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    if (t.respostaParseou !== true) {
      falhas.push(
        `turno ${i + 1}: respostaParseou = ${t.respostaParseou}` +
        (t.erroParse ? ` (${t.erroParse.tipo}: ${t.erroParse.mensagem})` : '')
      );
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 2. hp_nunca_negativo
// ---------------------------------------------------------------------------

export function hp_nunca_negativo(log, _cenario) {
  const falhas = forEachState(log, (label, state) => {
    const errs = [];
    if (state.jogador && state.jogador.hp < 0) {
      errs.push(`${label}: jogador hp = ${state.jogador.hp}`);
    }
    if (state.inimigos) {
      for (const ini of state.inimigos) {
        if (ini.hp < 0) {
          errs.push(`${label}: inimigo ${ini.id} hp = ${ini.hp}`);
        }
      }
    }
    return errs;
  });
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 3. hp_nunca_acima_maximo
// ---------------------------------------------------------------------------

export function hp_nunca_acima_maximo(log, _cenario) {
  const falhas = forEachState(log, (label, state) => {
    const errs = [];
    if (state.jogador && state.jogador.hp > state.jogador.hpMax) {
      errs.push(
        `${label}: jogador hp ${state.jogador.hp} > hpMax ${state.jogador.hpMax}`
      );
    }
    if (state.inimigos) {
      for (const ini of state.inimigos) {
        if (ini.hp > ini.hpMax) {
          errs.push(
            `${label}: inimigo ${ini.id} hp ${ini.hp} > hpMax ${ini.hpMax}`
          );
        }
      }
    }
    return errs;
  });
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 4. mana_nunca_negativa
// ---------------------------------------------------------------------------

export function mana_nunca_negativa(log, _cenario) {
  const falhas = forEachState(log, (label, state) => {
    const errs = [];
    if (state.jogador && state.jogador.mana < 0) {
      errs.push(`${label}: jogador mana = ${state.jogador.mana}`);
    }
    return errs;
  });
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 5. mana_nunca_acima_maximo
// ---------------------------------------------------------------------------

export function mana_nunca_acima_maximo(log, _cenario) {
  const falhas = forEachState(log, (label, state) => {
    const errs = [];
    if (state.jogador && state.jogador.mana > state.jogador.manaMax) {
      errs.push(
        `${label}: jogador mana ${state.jogador.mana} > manaMax ${state.jogador.manaMax}`
      );
    }
    return errs;
  });
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 6. mana_descontada_ao_usar_magia
// ---------------------------------------------------------------------------

export function mana_descontada_ao_usar_magia(log, cenario) {
  const falhas = [];
  const magiaMap = new Map();
  for (const m of (cenario.personagem.magias || [])) {
    magiaMap.set(m.id, m);
  }

  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const intent = t.acaoJogador?.gameIntent;
    if (!intent || !intent.magiaId) continue;

    const magia = magiaMap.get(intent.magiaId);
    if (!magia) continue; // validated by magia_inexistente_nao_aceita

    const manaAntes = t.estadoAntes?.jogador?.mana;
    const manaApos = t.estadoApos?.jogador?.mana;
    if (manaAntes == null || manaApos == null) continue;

    if (manaAntes < magia.custo_mana) {
      // Insufficient mana — action should have been blocked; mana must stay unchanged
      if (manaApos !== manaAntes) {
        falhas.push(
          `turno ${i + 1}: magia ${intent.magiaId} custo ${magia.custo_mana}, ` +
          `mana insuficiente (antes=${manaAntes}), mana deveria permanecer ${manaAntes} mas obtido=${manaApos}`
        );
      }
    } else {
      const expected = manaAntes - magia.custo_mana;
      if (manaApos !== expected) {
        falhas.push(
          `turno ${i + 1}: magia ${intent.magiaId} custo ${magia.custo_mana}, ` +
          `mana antes=${manaAntes} esperado apos=${expected} obtido=${manaApos}`
        );
      }
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 7. dano_aplicado_quando_ataque_sucede
// ---------------------------------------------------------------------------

export function dano_aplicado_quando_ataque_sucede(log, _cenario) {
  const falhas = [];
  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const rm = t.resolucaoMecanica;
    if (!rm || rm.sucesso !== true) continue;

    const tipo = rm.tipo || t.acaoJogador?.gameIntent?.tipo;
    if (!tipo || !['atacar', 'ataque', 'usar_habilidade'].includes(tipo)) continue;

    // Exception: full mitigation
    if (rm.danoCalculado === 0) continue;

    const alvoId = rm.alvo || t.acaoJogador?.gameIntent?.alvo;
    if (!alvoId) continue;

    const antes = t.estadoAntes?.inimigos?.find(e => e.id === alvoId);
    const apos = t.estadoApos?.inimigos?.find(e => e.id === alvoId);
    if (!antes || !apos) continue;

    if (apos.hp >= antes.hp) {
      falhas.push(
        `turno ${i + 1}: ataque sucesso contra ${alvoId}, ` +
        `hp antes=${antes.hp} apos=${apos.hp} (esperado menor)`
      );
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 8. monstro_derrotado_quando_hp_zero
// ---------------------------------------------------------------------------

export function monstro_derrotado_quando_hp_zero(log, _cenario) {
  const falhas = [];
  // Check estadoApos of every turno and estadoFinal
  const snapshots = [];
  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    if (t.estadoApos?.inimigos) {
      snapshots.push({ label: `turno ${i + 1} estadoApos`, inimigos: t.estadoApos.inimigos });
    }
  }
  if (log.estadoFinal?.inimigos) {
    snapshots.push({ label: 'estadoFinal', inimigos: log.estadoFinal.inimigos });
  }

  for (const snap of snapshots) {
    for (const ini of snap.inimigos) {
      if (ini.hp === 0) {
        const status = ini.status || [];
        if (!status.includes('derrotado')) {
          falhas.push(
            `${snap.label}: inimigo ${ini.id} hp=0 mas status=${JSON.stringify(status)} (falta "derrotado")`
          );
        }
      }
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 9. combate_encerra_sem_monstros_vivos
// ---------------------------------------------------------------------------

export function combate_encerra_sem_monstros_vivos(log, _cenario) {
  const falhas = [];
  const ef = log.estadoFinal;
  if (!ef || !ef.inimigos) return result(falhas);

  const allDead = ef.inimigos.every(ini => ini.hp === 0);
  if (allDead && ef.combateAtivo !== false) {
    falhas.push(
      `estadoFinal: todos inimigos hp=0 mas combateAtivo=${ef.combateAtivo}`
    );
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 10. xp_distribuido_apos_vitoria
// ---------------------------------------------------------------------------

export function xp_distribuido_apos_vitoria(log, _cenario) {
  const falhas = [];
  const ef = log.estadoFinal;
  if (!ef || ef.resultado !== 'vitoria') return result(falhas);

  if (!ef.jogador || ef.jogador.xpGanho == null || ef.jogador.xpGanho <= 0) {
    falhas.push(
      `estadoFinal: resultado=vitoria mas xpGanho=${ef.jogador?.xpGanho ?? 'undefined'}`
    );
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 11. equipamento_usado_existe_no_inventario
// ---------------------------------------------------------------------------

export function equipamento_usado_existe_no_inventario(log, cenario) {
  const falhas = [];
  const equipIds = new Set(
    (cenario.personagem.equipamentos || []).map(e => e.id)
  );

  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const intent = t.acaoJogador?.gameIntent;
    if (!intent || !intent.arma) continue;

    if (!equipIds.has(intent.arma)) {
      // The player referenced a weapon they don't own.
      // This is only a *failure* if the system actually allowed a mechanical
      // effect to happen — i.e. resolucaoMecanica.sucesso === true, or
      // enemy HP decreased (damage was applied despite the invalid weapon).
      const rm = t.resolucaoMecanica;
      const mechanicalSuccess = rm && rm.sucesso === true;

      const alvoId = rm?.alvo || rm?.alvoId || intent.alvo;
      const hpAntes = alvoId
        ? t.estadoAntes?.inimigos?.find(e => e.id === alvoId)?.hp
        : undefined;
      const hpApos = alvoId
        ? t.estadoApos?.inimigos?.find(e => e.id === alvoId)?.hp
        : undefined;
      const damageApplied =
        hpAntes != null && hpApos != null && hpApos < hpAntes;

      if (mechanicalSuccess || damageApplied) {
        falhas.push(
          `turno ${i + 1}: arma "${intent.arma}" nao existe em equipamentos mas ` +
          `efeito mecanico ocorreu (sucesso=${rm?.sucesso}, hpAntes=${hpAntes}, hpApos=${hpApos})`
        );
      }
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 12. magia_inexistente_nao_aceita
// ---------------------------------------------------------------------------

export function magia_inexistente_nao_aceita(log, cenario) {
  const falhas = [];
  const magiaIds = new Set(
    (cenario.personagem.magias || []).map(m => m.id)
  );

  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const intent = t.acaoJogador?.gameIntent;
    if (!intent || !intent.magiaId) continue;

    if (!magiaIds.has(intent.magiaId)) {
      // The action references a non-existent magia — it should NOT produce
      // a successful mechanical effect.
      const rm = t.resolucaoMecanica;
      if (rm && rm.sucesso === true) {
        falhas.push(
          `turno ${i + 1}: magiaId "${intent.magiaId}" nao existe no personagem mas resolucaoMecanica.sucesso=true`
        );
      }
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 13. ia_nao_inventou_habilidade
// ---------------------------------------------------------------------------

export function ia_nao_inventou_habilidade(log, cenario) {
  const falhas = [];
  const validIds = new Set();
  for (const m of (cenario.personagem.magias || [])) validIds.add(m.id);
  for (const h of (cenario.personagem.habilidades || [])) validIds.add(h.id);

  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const acoes = t.respostaIA?.acoes;
    if (!acoes || !Array.isArray(acoes)) continue;

    for (const acao of acoes) {
      const refId = acao.magiaId || acao.habilidadeId;
      if (refId && !validIds.has(refId)) {
        falhas.push(
          `turno ${i + 1}: respostaIA.acoes referencia "${refId}" que nao existe no personagem`
        );
      }
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// 14. alvos_referenciados_por_id
// ---------------------------------------------------------------------------

export function alvos_referenciados_por_id(log, cenario) {
  const falhas = [];
  const inimigoIds = new Set(
    (cenario.inimigos || []).map(ini => ini.id)
  );

  for (let i = 0; i < log.turnos.length; i++) {
    const t = log.turnos[i];
    const intent = t.acaoJogador?.gameIntent;
    if (!intent || !intent.alvo) continue;

    if (!inimigoIds.has(intent.alvo)) {
      falhas.push(
        `turno ${i + 1}: gameIntent.alvo "${intent.alvo}" nao encontrado em cenario.inimigos`
      );
    }
  }
  return result(falhas);
}

// ---------------------------------------------------------------------------
// INVARIANT_MAP & runInvariants
// ---------------------------------------------------------------------------

const INVARIANT_MAP = {
  resposta_ia_parseavel,
  hp_nunca_negativo,
  hp_nunca_acima_maximo,
  mana_nunca_negativa,
  mana_nunca_acima_maximo,
  mana_descontada_ao_usar_magia,
  dano_aplicado_quando_ataque_sucede,
  monstro_derrotado_quando_hp_zero,
  combate_encerra_sem_monstros_vivos,
  xp_distribuido_apos_vitoria,
  equipamento_usado_existe_no_inventario,
  magia_inexistente_nao_aceita,
  ia_nao_inventou_habilidade,
  alvos_referenciados_por_id,
};

export { INVARIANT_MAP };

export function runInvariants(log, cenario) {
  const requested = cenario.invariantes || [];
  const results = {};
  let passed = 0;
  let failed = 0;
  for (const name of requested) {
    const fn = INVARIANT_MAP[name];
    if (!fn) {
      results[name] = { ok: false, falhas: [`Invariante desconhecida: ${name}`] };
      failed++;
      continue;
    }
    const r = fn(log, cenario);
    results[name] = r;
    if (r.ok) passed++;
    else failed++;
  }
  return { passed, failed, total: requested.length, results };
}
