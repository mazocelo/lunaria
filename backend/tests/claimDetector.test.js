import { describe, it, expect } from 'vitest';
import { detectClaims, validateClaim, runClaimDetection } from '../helpers/claimDetector.js';

// ── detectClaims — extracao de alegacoes via regex ──

describe('detectClaims', () => {
  it('detecta habilidade com "eu ativo"', () => {
    const claims = detectClaims('eu ativo Bola de Fogo');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('habilidade');
    expect(claims[0].claim).toContain('bola de fogo');
  });

  it('detecta item com "eu uso"', () => {
    const claims = detectClaims('eu uso a pocao de cura');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('item');
    expect(claims[0].claim).toContain('pocao de cura');
  });

  it('detecta item com "saco"', () => {
    const claims = detectClaims('saco minha espada longa');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('item');
    expect(claims[0].claim).toContain('espada longa');
  });

  it('detecta item com "eu bebo"', () => {
    const claims = detectClaims('eu bebo uma pocao');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('item');
  });

  it('detecta habilidade com "lanço"', () => {
    const claims = detectClaims('eu lanço Raio de Gelo no monstro');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('habilidade');
  });

  it('detecta alegacao de posse previa com "ja tinha"', () => {
    const claims = detectClaims('eu ja tinha uma corda');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('item');
    expect(claims[0].claim).toContain('corda');
  });

  it('detecta fato previo com "ja sabia"', () => {
    const claims = detectClaims('eu ja sabia que a porta estava trancada');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('fato_previo');
    expect(claims[0].claim).toContain('porta');
  });

  it('detecta fato previo com "ja combinei"', () => {
    const claims = detectClaims('eu ja combinei com o elfo que ele ficaria de vigia');
    expect(claims).toHaveLength(1);
    expect(claims[0].tipo).toBe('fato_previo');
  });

  it('nao detecta acao simples sem trigger', () => {
    expect(detectClaims('eu olho ao redor')).toHaveLength(0);
    expect(detectClaims('converso com o taverneiro')).toHaveLength(0);
    expect(detectClaims('ando ate a porta')).toHaveLength(0);
  });

  it('retorna array vazio para input null/undefined/vazio', () => {
    expect(detectClaims(null)).toHaveLength(0);
    expect(detectClaims(undefined)).toHaveLength(0);
    expect(detectClaims('')).toHaveLength(0);
    expect(detectClaims(123)).toHaveLength(0);
  });

  it('ignora claims muito curtos (< 2 chars)', () => {
    // "eu uso a" → claim seria "" ou 1 char
    const claims = detectClaims('eu uso a');
    // Should not match anything meaningful
    expect(claims.every(c => c.claim.length >= 2)).toBe(true);
  });
});

// ── validateClaim — validacao contra fontes de verdade ──

describe('validateClaim', () => {
  const baseSources = {
    turnState: { inventario: [], mana: { atual: 20, max: 30 } },
    personagemCompleto: {
      equipamentos: [],
      habilidadesClasse: [],
      magias: [],
      habilidades: [],
      vantagens: [],
    },
    cooldowns: {},
  };

  describe('items', () => {
    it('item existente no inventario → status ok', () => {
      const sources = {
        ...baseSources,
        turnState: { inventario: [{ nome: 'Espada Longa' }] },
      };
      const result = validateClaim({ claim: 'espada longa', tipo: 'item' }, sources);
      expect(result.status).toBe('ok');
      expect(result.blockLevel).toBeNull();
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('item existente com alias (match parcial) → status ok', () => {
      const sources = {
        ...baseSources,
        turnState: { inventario: [{ nome: 'Poção de Cura Menor' }] },
      };
      const result = validateClaim({ claim: 'pocao de cura', tipo: 'item' }, sources);
      // "pocao de cura" is contained in "pocao de cura menor" → found
      expect(result.status).toBe('ok');
    });

    it('item inexistente → status inexistente, blockLevel hard', () => {
      const result = validateClaim({ claim: 'espada flamejante', tipo: 'item' }, baseSources);
      expect(result.status).toBe('inexistente');
      expect(result.blockLevel).toBe('hard');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.acaoRecomendada).toBe('bloquear');
    });

    it('item no personagemCompleto.equipamentos → status ok', () => {
      const sources = {
        ...baseSources,
        personagemCompleto: {
          ...baseSources.personagemCompleto,
          equipamentos: [{ nome: 'Escudo de Ferro' }],
        },
      };
      const result = validateClaim({ claim: 'escudo de ferro', tipo: 'item' }, sources);
      expect(result.status).toBe('ok');
      expect(result.fonte).toBe('personagemCompleto.equipamentos');
    });

    it('match parcial ambiguo → status suspeito, blockLevel soft', () => {
      const sources = {
        ...baseSources,
        turnState: {
          inventario: [
            { nome: 'Espada Longa' },
            { nome: 'Espada Curta' },
          ],
        },
      };
      const result = validateClaim({ claim: 'espada', tipo: 'item' }, sources);
      expect(result.status).toBe('suspeito');
      expect(result.blockLevel).toBe('soft');
      expect(result.acaoRecomendada).toBe('pedir_clarificacao');
    });
  });

  describe('habilidades', () => {
    it('habilidade existente → status ok', () => {
      const sources = {
        ...baseSources,
        personagemCompleto: {
          ...baseSources.personagemCompleto,
          habilidadesClasse: [{ nome: 'Golpe Brutal', id: 1 }],
        },
      };
      const result = validateClaim({ claim: 'golpe brutal', tipo: 'habilidade' }, sources);
      expect(result.status).toBe('ok');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('habilidade inexistente → status inexistente, blockLevel hard', () => {
      const result = validateClaim({ claim: 'poder divino supremo', tipo: 'habilidade' }, baseSources);
      expect(result.status).toBe('inexistente');
      expect(result.blockLevel).toBe('hard');
      expect(result.motivo).toContain('nao encontrada');
    });

    it('habilidade em cooldown → status suspeito, blockLevel soft (mecanica autoritativa tem precedencia)', () => {
      const sources = {
        ...baseSources,
        personagemCompleto: {
          ...baseSources.personagemCompleto,
          habilidadesClasse: [{ nome: 'Investida', id: 5, custo_mana: 0 }],
        },
        cooldowns: { hab_5: 2 },
      };
      const result = validateClaim({ claim: 'investida', tipo: 'habilidade' }, sources);
      expect(result.status).toBe('suspeito');
      expect(result.blockLevel).toBe('soft');
      expect(result.motivo).toContain('cooldown');
    });

    it('magia com mana insuficiente → status suspeito, blockLevel soft (mecanica autoritativa tem precedencia)', () => {
      const sources = {
        ...baseSources,
        turnState: { inventario: [], mana: { atual: 3, max: 30 } },
        personagemCompleto: {
          ...baseSources.personagemCompleto,
          magias: [{ nome: 'Bola de Fogo', id: 10, custo_mana: 10 }],
        },
      };
      const result = validateClaim({ claim: 'bola de fogo', tipo: 'habilidade' }, sources);
      expect(result.status).toBe('suspeito');
      expect(result.blockLevel).toBe('soft');
      expect(result.motivo).toContain('mana insuficiente');
    });

    it('magia com mana suficiente → status ok', () => {
      const sources = {
        ...baseSources,
        turnState: { inventario: [], mana: { atual: 15, max: 30 } },
        personagemCompleto: {
          ...baseSources.personagemCompleto,
          magias: [{ nome: 'Bola de Fogo', id: 10, custo_mana: 10 }],
        },
      };
      const result = validateClaim({ claim: 'bola de fogo', tipo: 'habilidade' }, sources);
      expect(result.status).toBe('ok');
    });
  });

  describe('fatos previos', () => {
    it('fato encontrado no historico → status ok', () => {
      const sources = {
        ...baseSources,
        mensagensRecentes: [
          { tipo: 'mestre', message: 'A porta esta trancada com uma fechadura antiga.' },
        ],
      };
      const result = validateClaim({ claim: 'porta esta trancada', tipo: 'fato_previo' }, sources);
      expect(result.status).toBe('ok');
      expect(result.blockLevel).toBeNull();
      expect(result.fonte).toBe('sessao.mensagens');
    });

    it('fato encontrado na memoria semantica → status ok', () => {
      const sources = {
        ...baseSources,
        mensagensRecentes: [],
        memoriaSemantica: ['O grupo fez um acordo com o elfo guardiao'],
      };
      const result = validateClaim({ claim: 'acordo com o elfo', tipo: 'fato_previo' }, sources);
      expect(result.status).toBe('ok');
      expect(result.fonte).toBe('mestreContexto.memoriaSemantica');
    });

    it('fato sem evidencia → status incerto, blockLevel soft', () => {
      const sources = {
        ...baseSources,
        mensagensRecentes: [],
        memoriaSemantica: [],
      };
      const result = validateClaim({ claim: 'a senha secreta', tipo: 'fato_previo' }, sources);
      expect(result.status).toBe('incerto');
      expect(result.blockLevel).toBe('soft');
      expect(result.acaoRecomendada).toBe('pedir_clarificacao');
    });

    it('nunca retorna hard block para fatos', () => {
      const result = validateClaim({ claim: 'algo inventado', tipo: 'fato_previo' }, baseSources);
      expect(result.blockLevel).not.toBe('hard');
    });
  });

  describe('tipo desconhecido', () => {
    it('tipo nao reconhecido → status ok, seguir', () => {
      const result = validateClaim({ claim: 'algo', tipo: 'desconhecido' }, baseSources);
      expect(result.status).toBe('ok');
      expect(result.acaoRecomendada).toBe('seguir');
    });
  });
});

// ── runClaimDetection — integracao detectar + validar ──

describe('runClaimDetection', () => {
  it('mensagem sem alegacao → array vazio', () => {
    const result = runClaimDetection('eu olho ao redor', {
      turnState: { inventario: [] },
      personagemCompleto: {},
    });
    expect(result).toHaveLength(0);
  });

  it('item existente → flag com status ok', () => {
    const result = runClaimDetection('eu uso a espada longa', {
      turnState: { inventario: [{ nome: 'Espada Longa' }] },
      personagemCompleto: {},
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('ok');
  });

  it('item inexistente → flag com blockLevel hard', () => {
    const result = runClaimDetection('eu uso o cajado arcano', {
      turnState: { inventario: [] },
      personagemCompleto: { equipamentos: [] },
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('inexistente');
    expect(result[0].blockLevel).toBe('hard');
  });

  it('shape do ClaimFlag tem todos os campos esperados', () => {
    const result = runClaimDetection('eu uso a espada', {
      turnState: { inventario: [{ nome: 'Espada' }] },
      personagemCompleto: {},
    });
    expect(result).toHaveLength(1);
    const flag = result[0];
    expect(flag).toHaveProperty('claim');
    expect(flag).toHaveProperty('tipo');
    expect(flag).toHaveProperty('status');
    expect(flag).toHaveProperty('motivo');
    expect(flag).toHaveProperty('fonte');
    expect(flag).toHaveProperty('acaoRecomendada');
    expect(flag).toHaveProperty('blockLevel');
    expect(flag).toHaveProperty('confidence');
    expect(flag).toHaveProperty('candidatos');
  });
});
