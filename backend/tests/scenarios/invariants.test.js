import { describe, it, expect } from 'vitest';
import * as inv from './invariants.js';

// ---------------------------------------------------------------------------
// Helpers — minimal synthetic fixtures
// ---------------------------------------------------------------------------

function baseCenario(overrides = {}) {
  return {
    personagem: {
      magias: [
        { id: 'luz_divina', nome: 'Luz Divina', custo_mana: 3 },
      ],
      habilidades: [
        { id: 'investida', nome: 'Investida', tipo: 'ataque', cooldown_turnos: 2 },
      ],
      equipamentos: [
        { id: 'espada_longa', nome: 'Espada Longa' },
      ],
    },
    inimigos: [
      { id: 'goblin_1', nome: 'Goblin', hp: 12, hpMax: 12, status: [] },
    ],
    invariantes: [],
    ...overrides,
  };
}

function baseJogador(overrides = {}) {
  return { hp: 30, hpMax: 30, mana: 10, manaMax: 10, status: [], ...overrides };
}

function baseInimigo(overrides = {}) {
  return { id: 'goblin_1', hp: 12, hpMax: 12, status: [], ...overrides };
}

function baseTurno(overrides = {}) {
  return {
    turno: 1,
    acaoJogador: { tipo: 'mensagem', texto: 'ataco', gameIntent: { categoria: 'combate', tipo: 'atacar', arma: 'espada_longa', alvo: 'goblin_1' } },
    estadoAntes: { jogador: baseJogador(), inimigos: [baseInimigo()], combateAtivo: true },
    estadoApos: { jogador: baseJogador({ hp: 25 }), inimigos: [baseInimigo({ hp: 7 })], combateAtivo: true },
    respostaIA: { narracao: 'Voce golpeia.', acoes: [], fimDeTurno: false },
    respostaParseou: true,
    erroParse: null,
    resolucaoMecanica: { sucesso: true, tipo: 'atacar', alvo: 'goblin_1', danoCalculado: 5 },
    ...overrides,
  };
}

function baseLog(turnosOverride, estadoFinalOverride) {
  const turnos = turnosOverride || [baseTurno()];
  return {
    turnos,
    statusExecucao: 'concluida',
    estadoFinal: estadoFinalOverride || {
      jogador: baseJogador({ hp: 25, xpGanho: 25 }),
      inimigos: [baseInimigo({ hp: 0, status: ['derrotado'] })],
      combateAtivo: false,
      resultado: 'vitoria',
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('invariants — all pass on valid log', () => {
  const cenario = baseCenario();
  // A complete valid scenario: attack with sword, goblin defeated
  const turno1 = baseTurno();
  const turno2 = baseTurno({
    turno: 2,
    acaoJogador: {
      tipo: 'mensagem', texto: 'ataco de novo',
      gameIntent: { categoria: 'combate', tipo: 'atacar', arma: 'espada_longa', alvo: 'goblin_1' },
    },
    estadoAntes: { jogador: baseJogador({ hp: 25 }), inimigos: [baseInimigo({ hp: 7 })], combateAtivo: true },
    estadoApos: { jogador: baseJogador({ hp: 25 }), inimigos: [baseInimigo({ hp: 0, status: ['derrotado'] })], combateAtivo: false },
    resolucaoMecanica: { sucesso: true, tipo: 'atacar', alvo: 'goblin_1', danoCalculado: 7 },
  });

  const log = baseLog([turno1, turno2]);

  it('resposta_ia_parseavel passes', () => {
    expect(inv.resposta_ia_parseavel(log, cenario).ok).toBe(true);
  });
  it('hp_nunca_negativo passes', () => {
    expect(inv.hp_nunca_negativo(log, cenario).ok).toBe(true);
  });
  it('hp_nunca_acima_maximo passes', () => {
    expect(inv.hp_nunca_acima_maximo(log, cenario).ok).toBe(true);
  });
  it('mana_nunca_negativa passes', () => {
    expect(inv.mana_nunca_negativa(log, cenario).ok).toBe(true);
  });
  it('mana_nunca_acima_maximo passes', () => {
    expect(inv.mana_nunca_acima_maximo(log, cenario).ok).toBe(true);
  });
  it('monstro_derrotado_quando_hp_zero passes', () => {
    expect(inv.monstro_derrotado_quando_hp_zero(log, cenario).ok).toBe(true);
  });
  it('combate_encerra_sem_monstros_vivos passes', () => {
    expect(inv.combate_encerra_sem_monstros_vivos(log, cenario).ok).toBe(true);
  });
  it('xp_distribuido_apos_vitoria passes', () => {
    expect(inv.xp_distribuido_apos_vitoria(log, cenario).ok).toBe(true);
  });
  it('equipamento_usado_existe_no_inventario passes', () => {
    expect(inv.equipamento_usado_existe_no_inventario(log, cenario).ok).toBe(true);
  });
  it('alvos_referenciados_por_id passes', () => {
    expect(inv.alvos_referenciados_por_id(log, cenario).ok).toBe(true);
  });
  it('ia_nao_inventou_habilidade passes', () => {
    expect(inv.ia_nao_inventou_habilidade(log, cenario).ok).toBe(true);
  });
  it('dano_aplicado_quando_ataque_sucede passes', () => {
    expect(inv.dano_aplicado_quando_ataque_sucede(log, cenario).ok).toBe(true);
  });
});

describe('hp_nunca_negativo — fails when hp < 0', () => {
  it('detects negative jogador HP', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador({ hp: -2 }),
        inimigos: [baseInimigo()],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const r = inv.hp_nunca_negativo(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas).toHaveLength(1);
    expect(r.falhas[0]).toContain('hp = -2');
  });

  it('detects negative inimigo HP', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador(),
        inimigos: [baseInimigo({ hp: -1 })],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const r = inv.hp_nunca_negativo(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('goblin_1');
  });
});

describe('hp_nunca_acima_maximo — fails when hp > hpMax', () => {
  it('detects jogador HP above max', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador({ hp: 35, hpMax: 30 }),
        inimigos: [baseInimigo()],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const r = inv.hp_nunca_acima_maximo(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('35');
  });
});

describe('mana_nunca_negativa — fails when mana < 0', () => {
  it('detects negative mana', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador({ mana: -1 }),
        inimigos: [baseInimigo()],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const r = inv.mana_nunca_negativa(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('mana = -1');
  });
});

describe('mana_nunca_acima_maximo — fails when mana > manaMax', () => {
  it('detects mana above max', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador({ mana: 15, manaMax: 10 }),
        inimigos: [baseInimigo()],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const r = inv.mana_nunca_acima_maximo(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('15');
  });
});

describe('mana_descontada_ao_usar_magia — fails when mana not deducted', () => {
  it('detects incorrect mana after casting', () => {
    const cenario = baseCenario();
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Luz Divina',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'luz_divina', alvo: 'goblin_1' },
      },
      estadoAntes: { jogador: baseJogador({ mana: 10 }), inimigos: [baseInimigo()], combateAtivo: true },
      // mana should be 10 - 3 = 7, but we set 10 (not deducted)
      estadoApos: { jogador: baseJogador({ mana: 10 }), inimigos: [baseInimigo({ hp: 7 })], combateAtivo: true },
      resolucaoMecanica: { sucesso: true, tipo: 'usar_habilidade', alvo: 'goblin_1', danoCalculado: 5 },
    });
    const log = baseLog([turno]);
    const r = inv.mana_descontada_ao_usar_magia(log, cenario);
    expect(r.ok).toBe(false);
    expect(r.falhas).toHaveLength(1);
    expect(r.falhas[0]).toContain('esperado apos=7');
    expect(r.falhas[0]).toContain('obtido=10');
  });

  it('passes when mana correctly deducted', () => {
    const cenario = baseCenario();
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Luz Divina',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'luz_divina', alvo: 'goblin_1' },
      },
      estadoAntes: { jogador: baseJogador({ mana: 10 }), inimigos: [baseInimigo()], combateAtivo: true },
      estadoApos: { jogador: baseJogador({ mana: 7 }), inimigos: [baseInimigo({ hp: 7 })], combateAtivo: true },
      resolucaoMecanica: { sucesso: true, tipo: 'usar_habilidade', alvo: 'goblin_1', danoCalculado: 5 },
    });
    const log = baseLog([turno]);
    const r = inv.mana_descontada_ao_usar_magia(log, cenario);
    expect(r.ok).toBe(true);
  });

  it('passes when mana insufficient and mana stays unchanged (action blocked)', () => {
    const cenario = baseCenario();
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Luz Divina',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'luz_divina', alvo: 'goblin_1' },
      },
      estadoAntes: { jogador: baseJogador({ mana: 2 }), inimigos: [baseInimigo()], combateAtivo: true },
      // mana stays at 2 because cost is 3 and action is blocked
      estadoApos: { jogador: baseJogador({ mana: 2 }), inimigos: [baseInimigo()], combateAtivo: true },
    });
    const log = baseLog([turno]);
    const r = inv.mana_descontada_ao_usar_magia(log, cenario);
    expect(r.ok).toBe(true);
  });

  it('fails when mana insufficient but mana was floored to 0 instead of staying unchanged', () => {
    const cenario = baseCenario();
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Luz Divina',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'luz_divina', alvo: 'goblin_1' },
      },
      estadoAntes: { jogador: baseJogador({ mana: 2 }), inimigos: [baseInimigo()], combateAtivo: true },
      // mana was incorrectly deducted to 0 instead of staying at 2
      estadoApos: { jogador: baseJogador({ mana: 0 }), inimigos: [baseInimigo()], combateAtivo: true },
    });
    const log = baseLog([turno]);
    const r = inv.mana_descontada_ao_usar_magia(log, cenario);
    expect(r.ok).toBe(false);
    expect(r.falhas).toHaveLength(1);
    expect(r.falhas[0]).toContain('mana insuficiente');
    expect(r.falhas[0]).toContain('deveria permanecer 2');
    expect(r.falhas[0]).toContain('obtido=0');
  });
});

describe('dano_aplicado_quando_ataque_sucede — fails when hp not reduced', () => {
  it('detects no HP reduction on successful attack', () => {
    const turno = baseTurno({
      estadoAntes: { jogador: baseJogador(), inimigos: [baseInimigo({ hp: 12 })], combateAtivo: true },
      estadoApos: { jogador: baseJogador(), inimigos: [baseInimigo({ hp: 12 })], combateAtivo: true },
      resolucaoMecanica: { sucesso: true, tipo: 'atacar', alvo: 'goblin_1', danoCalculado: 5 },
    });
    const log = baseLog([turno]);
    const r = inv.dano_aplicado_quando_ataque_sucede(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('hp antes=12 apos=12');
  });

  it('skips check when danoCalculado is 0 (full mitigation)', () => {
    const turno = baseTurno({
      estadoAntes: { jogador: baseJogador(), inimigos: [baseInimigo({ hp: 12 })], combateAtivo: true },
      estadoApos: { jogador: baseJogador(), inimigos: [baseInimigo({ hp: 12 })], combateAtivo: true },
      resolucaoMecanica: { sucesso: true, tipo: 'atacar', alvo: 'goblin_1', danoCalculado: 0 },
    });
    const log = baseLog([turno]);
    const r = inv.dano_aplicado_quando_ataque_sucede(log, baseCenario());
    expect(r.ok).toBe(true);
  });
});

describe('monstro_derrotado_quando_hp_zero — fails when status missing', () => {
  it('detects missing derrotado status', () => {
    const turno = baseTurno({
      estadoApos: {
        jogador: baseJogador(),
        inimigos: [baseInimigo({ hp: 0, status: [] })],
        combateAtivo: false,
      },
    });
    const log = baseLog([turno], {
      jogador: baseJogador({ xpGanho: 25 }),
      inimigos: [baseInimigo({ hp: 0, status: [] })],
      combateAtivo: false,
      resultado: 'vitoria',
    });
    const r = inv.monstro_derrotado_quando_hp_zero(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas.length).toBeGreaterThanOrEqual(1);
    expect(r.falhas[0]).toContain('derrotado');
  });
});

describe('combate_encerra_sem_monstros_vivos — fails when combateAtivo still true', () => {
  it('detects combateAtivo=true with all dead', () => {
    const log = baseLog([baseTurno()], {
      jogador: baseJogador({ xpGanho: 25 }),
      inimigos: [baseInimigo({ hp: 0, status: ['derrotado'] })],
      combateAtivo: true,
      resultado: 'vitoria',
    });
    const r = inv.combate_encerra_sem_monstros_vivos(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('combateAtivo=true');
  });
});

describe('xp_distribuido_apos_vitoria — fails when no xp on victory', () => {
  it('detects zero xp on victory', () => {
    const log = baseLog([baseTurno()], {
      jogador: baseJogador({ xpGanho: 0 }),
      inimigos: [baseInimigo({ hp: 0, status: ['derrotado'] })],
      combateAtivo: false,
      resultado: 'vitoria',
    });
    const r = inv.xp_distribuido_apos_vitoria(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('xpGanho=0');
  });

  it('passes when result is not vitoria', () => {
    const log = baseLog([baseTurno()], {
      jogador: baseJogador({ xpGanho: 0 }),
      inimigos: [baseInimigo({ hp: 5 })],
      combateAtivo: false,
      resultado: 'fuga',
    });
    const r = inv.xp_distribuido_apos_vitoria(log, baseCenario());
    expect(r.ok).toBe(true);
  });
});

describe('equipamento_usado_existe_no_inventario — fails on unknown weapon', () => {
  it('detects unknown arma in gameIntent', () => {
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'ataco com lanca',
        gameIntent: { categoria: 'combate', tipo: 'atacar', arma: 'lanca_magica', alvo: 'goblin_1' },
      },
    });
    const log = baseLog([turno]);
    const r = inv.equipamento_usado_existe_no_inventario(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('lanca_magica');
  });
});

describe('magia_inexistente_nao_aceita — fails when unknown magia succeeds', () => {
  it('detects successful resolution of non-existent magia', () => {
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Bola de Fogo',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'bola_de_fogo', alvo: 'goblin_1' },
      },
      resolucaoMecanica: { sucesso: true, tipo: 'usar_habilidade', alvo: 'goblin_1', danoCalculado: 10 },
    });
    const log = baseLog([turno]);
    const r = inv.magia_inexistente_nao_aceita(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('bola_de_fogo');
  });

  it('passes when unknown magia does not succeed mechanically', () => {
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'Lanco Bola de Fogo',
        gameIntent: { categoria: 'combate', tipo: 'usar_habilidade', magiaId: 'bola_de_fogo', alvo: 'goblin_1' },
      },
      resolucaoMecanica: null,
    });
    const log = baseLog([turno]);
    const r = inv.magia_inexistente_nao_aceita(log, baseCenario());
    expect(r.ok).toBe(true);
  });
});

describe('ia_nao_inventou_habilidade — fails on invented ability', () => {
  it('detects invented magiaId in respostaIA.acoes', () => {
    const turno = baseTurno({
      respostaIA: {
        narracao: 'Voce lanca uma magia misteriosa',
        acoes: [{ magiaId: 'raio_solar_inexistente', alvo: 'goblin_1' }],
        fimDeTurno: false,
      },
    });
    const log = baseLog([turno]);
    const r = inv.ia_nao_inventou_habilidade(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('raio_solar_inexistente');
  });

  it('passes when respostaIA.acoes reference valid ids', () => {
    const turno = baseTurno({
      respostaIA: {
        narracao: 'Voce usa Investida',
        acoes: [{ habilidadeId: 'investida', alvo: 'goblin_1' }],
        fimDeTurno: false,
      },
    });
    const log = baseLog([turno]);
    const r = inv.ia_nao_inventou_habilidade(log, baseCenario());
    expect(r.ok).toBe(true);
  });
});

describe('alvos_referenciados_por_id — fails on unknown target', () => {
  it('detects unknown enemy id in gameIntent.alvo', () => {
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'ataco o dragao',
        gameIntent: { categoria: 'combate', tipo: 'atacar', arma: 'espada_longa', alvo: 'unknown_enemy' },
      },
    });
    const log = baseLog([turno]);
    const r = inv.alvos_referenciados_por_id(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('unknown_enemy');
  });
});

describe('resposta_ia_parseavel — fails on parse error', () => {
  it('detects respostaParseou = false', () => {
    const turno = baseTurno({
      respostaParseou: false,
      erroParse: { tipo: 'json_invalido', mensagem: 'Unexpected token' },
    });
    const log = baseLog([turno]);
    const r = inv.resposta_ia_parseavel(log, baseCenario());
    expect(r.ok).toBe(false);
    expect(r.falhas[0]).toContain('json_invalido');
  });
});

// ---------------------------------------------------------------------------
// runInvariants
// ---------------------------------------------------------------------------

describe('runInvariants', () => {
  it('runs only requested invariants', () => {
    const cenario = baseCenario({
      invariantes: ['hp_nunca_negativo', 'mana_nunca_negativa'],
    });
    const log = baseLog([baseTurno()]);
    const summary = inv.runInvariants(log, cenario);
    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(2);
    expect(summary.failed).toBe(0);
    expect(Object.keys(summary.results)).toEqual(['hp_nunca_negativo', 'mana_nunca_negativa']);
  });

  it('handles unknown invariant name gracefully', () => {
    const cenario = baseCenario({
      invariantes: ['hp_nunca_negativo', 'invariante_fantasma'],
    });
    const log = baseLog([baseTurno()]);
    const summary = inv.runInvariants(log, cenario);
    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.results.invariante_fantasma.ok).toBe(false);
    expect(summary.results.invariante_fantasma.falhas[0]).toContain('Invariante desconhecida');
  });

  it('returns all passed when all invariants ok', () => {
    const cenario = baseCenario({
      invariantes: ['resposta_ia_parseavel', 'hp_nunca_negativo', 'alvos_referenciados_por_id'],
    });
    const log = baseLog([baseTurno()]);
    const summary = inv.runInvariants(log, cenario);
    expect(summary.passed).toBe(3);
    expect(summary.failed).toBe(0);
  });

  it('counts failures correctly', () => {
    const cenario = baseCenario({
      invariantes: ['hp_nunca_negativo', 'alvos_referenciados_por_id'],
    });
    const turno = baseTurno({
      acaoJogador: {
        tipo: 'mensagem', texto: 'ataco',
        gameIntent: { categoria: 'combate', tipo: 'atacar', arma: 'espada_longa', alvo: 'fantasma_xyz' },
      },
      estadoApos: {
        jogador: baseJogador({ hp: -5 }),
        inimigos: [baseInimigo()],
        combateAtivo: true,
      },
    });
    const log = baseLog([turno]);
    const summary = inv.runInvariants(log, cenario);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(2);
  });

  it('returns empty results when no invariants requested', () => {
    const cenario = baseCenario({ invariantes: [] });
    const log = baseLog([baseTurno()]);
    const summary = inv.runInvariants(log, cenario);
    expect(summary.total).toBe(0);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.results).toEqual({});
  });
});
