import { describe, it, expect } from 'vitest';
import {
  pontosVantagemBase,
  maxCustoDesvantagem,
  tierDesbloqueado,
  pontosAtributoBonus,
  pontosAtributoTotal,
  xpParaNivel,
  xpAcumuladoParaNivel,
  calcularNivelPorXP,
  xpParaProximoNivel,
  calcularPontosVantagem,
  validarAtributos,
  validarVantagens,
  validarDesvantagens,
  verificarLevelUp,
  EVOLUCAO,
} from '../helpers/evolucaoHelper.js';

// ── pontosVantagemBase ──

describe('pontosVantagemBase', () => {
  it('nivel 1 retorna 10 (base)', () => {
    expect(pontosVantagemBase(1)).toBe(10);
  });

  it('nivel 2 retorna 11', () => {
    expect(pontosVantagemBase(2)).toBe(11);
  });

  it('nivel 10 retorna 19', () => {
    expect(pontosVantagemBase(10)).toBe(19);
  });

  it('nivel 20 retorna 29', () => {
    expect(pontosVantagemBase(20)).toBe(29);
  });

  it('nivel acima de 20 e capped em 29', () => {
    expect(pontosVantagemBase(25)).toBe(29);
    expect(pontosVantagemBase(100)).toBe(29);
  });

  it('cresce linearmente de 1 a 20', () => {
    for (let n = 1; n <= 20; n++) {
      expect(pontosVantagemBase(n)).toBe(10 + (n - 1));
    }
  });
});

// ── maxCustoDesvantagem ──

describe('maxCustoDesvantagem', () => {
  it('nivel 1 retorna 3', () => {
    expect(maxCustoDesvantagem(1)).toBe(3);
  });

  it('niveis 1-4 retornam 3', () => {
    for (let n = 1; n <= 4; n++) {
      expect(maxCustoDesvantagem(n)).toBe(3);
    }
  });

  it('niveis 5-8 retornam 4', () => {
    for (let n = 5; n <= 8; n++) {
      expect(maxCustoDesvantagem(n)).toBe(4);
    }
  });

  it('niveis 9-12 retornam 5', () => {
    for (let n = 9; n <= 12; n++) {
      expect(maxCustoDesvantagem(n)).toBe(5);
    }
  });

  it('niveis 13-16 retornam 6', () => {
    for (let n = 13; n <= 16; n++) {
      expect(maxCustoDesvantagem(n)).toBe(6);
    }
  });

  it('niveis 17-20 retornam 7', () => {
    for (let n = 17; n <= 20; n++) {
      expect(maxCustoDesvantagem(n)).toBe(7);
    }
  });

  it('nivel acima de 20 e capped em 7', () => {
    expect(maxCustoDesvantagem(25)).toBe(7);
    expect(maxCustoDesvantagem(100)).toBe(7);
  });
});

// ── tierDesbloqueado ──

describe('tierDesbloqueado', () => {
  it('nivel 1 retorna tier 1', () => {
    expect(tierDesbloqueado(1)).toBe(1);
  });

  it('niveis 1-4 retornam tier 1', () => {
    for (let n = 1; n <= 4; n++) {
      expect(tierDesbloqueado(n)).toBe(1);
    }
  });

  it('niveis 5-8 retornam tier 2', () => {
    for (let n = 5; n <= 8; n++) {
      expect(tierDesbloqueado(n)).toBe(2);
    }
  });

  it('niveis 9-12 retornam tier 3', () => {
    for (let n = 9; n <= 12; n++) {
      expect(tierDesbloqueado(n)).toBe(3);
    }
  });

  it('niveis 13-16 retornam tier 4', () => {
    for (let n = 13; n <= 16; n++) {
      expect(tierDesbloqueado(n)).toBe(4);
    }
  });

  it('niveis 17-20 retornam tier 5', () => {
    for (let n = 17; n <= 20; n++) {
      expect(tierDesbloqueado(n)).toBe(5);
    }
  });

  it('nivel acima de 20 e capped em tier 5', () => {
    expect(tierDesbloqueado(25)).toBe(5);
  });

  it('boundary: nivel 4 → tier 1, nivel 5 → tier 2', () => {
    expect(tierDesbloqueado(4)).toBe(1);
    expect(tierDesbloqueado(5)).toBe(2);
  });

  it('boundary: nivel 8 → tier 2, nivel 9 → tier 3', () => {
    expect(tierDesbloqueado(8)).toBe(2);
    expect(tierDesbloqueado(9)).toBe(3);
  });
});

// ── pontosAtributoBonus ──

describe('pontosAtributoBonus', () => {
  it('nivel 1 retorna 0', () => {
    expect(pontosAtributoBonus(1)).toBe(0);
  });

  it('nivel 2 retorna 0', () => {
    expect(pontosAtributoBonus(2)).toBe(0);
  });

  it('nivel 3 retorna 2', () => {
    expect(pontosAtributoBonus(3)).toBe(2);
  });

  it('nivel 4 retorna 2 (nao ganha em nivel par)', () => {
    expect(pontosAtributoBonus(4)).toBe(2);
  });

  it('nivel 5 retorna 4', () => {
    expect(pontosAtributoBonus(5)).toBe(4);
  });

  it('nivel 7 retorna 6', () => {
    expect(pontosAtributoBonus(7)).toBe(6);
  });

  it('nivel 20 retorna 18', () => {
    // floor((20-1)/2)*2 = floor(9.5)*2 = 9*2 = 18
    expect(pontosAtributoBonus(20)).toBe(18);
  });

  it('nivel 19 retorna 18', () => {
    // floor((19-1)/2)*2 = floor(9)*2 = 9*2 = 18
    expect(pontosAtributoBonus(19)).toBe(18);
  });

  it('nivel acima de 20 e capped', () => {
    expect(pontosAtributoBonus(25)).toBe(18);
  });

  it('bonus cresce em niveis impares a partir do 3', () => {
    let anterior = 0;
    for (let n = 3; n <= 19; n += 2) {
      const bonus = pontosAtributoBonus(n);
      expect(bonus).toBe(anterior + 2);
      anterior = bonus;
    }
  });
});

// ── pontosAtributoTotal ──

describe('pontosAtributoTotal', () => {
  it('nivel 1 retorna 75 (base)', () => {
    expect(pontosAtributoTotal(1)).toBe(60);
  });

  it('nivel 3 retorna 77', () => {
    expect(pontosAtributoTotal(3)).toBe(62);
  });

  it('nivel 5 retorna 79', () => {
    expect(pontosAtributoTotal(5)).toBe(64);
  });

  it('nivel 20 retorna 93', () => {
    // 60 + 18 = 78
    expect(pontosAtributoTotal(20)).toBe(78);
  });

  it('e consistente com base + bonus', () => {
    for (let n = 1; n <= 20; n++) {
      expect(pontosAtributoTotal(n)).toBe(60 + pontosAtributoBonus(n));
    }
  });
});

// ── xpParaNivel ──

describe('xpParaNivel', () => {
  it('nivel 1 → 100 XP para subir', () => {
    expect(xpParaNivel(1)).toBe(100);
  });

  it('nivel 2 → 200 XP para subir', () => {
    expect(xpParaNivel(2)).toBe(200);
  });

  it('nivel 3 → 300 XP para subir', () => {
    expect(xpParaNivel(3)).toBe(300);
  });

  it('nivel 4 → 400 XP para subir', () => {
    expect(xpParaNivel(4)).toBe(400);
  });

  it('nivel 5 → 500 XP para subir', () => {
    expect(xpParaNivel(5)).toBe(500);
  });

  it('nivel 10 → 2000 XP para subir', () => {
    // XP[10] - XP[9] = 6500 - 4500 = 2000
    expect(xpParaNivel(10)).toBe(2000);
  });

  it('nivel 19 → 11000 XP para subir', () => {
    // XP[19] - XP[18] = 69500 - 58500 = 11000
    expect(xpParaNivel(19)).toBe(11000);
  });

  it('nivel 20 (max) retorna infinito', () => {
    expect(xpParaNivel(20)).toBe(Number.POSITIVE_INFINITY);
  });

  it('nivel acima de 20 retorna infinito', () => {
    expect(xpParaNivel(25)).toBe(Number.POSITIVE_INFINITY);
  });
});

// ── xpAcumuladoParaNivel ──

describe('xpAcumuladoParaNivel', () => {
  it('nivel 1 retorna 0', () => {
    expect(xpAcumuladoParaNivel(1)).toBe(0);
  });

  it('nivel 0 ou negativo retorna 0', () => {
    expect(xpAcumuladoParaNivel(0)).toBe(0);
    expect(xpAcumuladoParaNivel(-1)).toBe(0);
  });

  it('nivel 2 retorna 100', () => {
    expect(xpAcumuladoParaNivel(2)).toBe(100);
  });

  it('nivel 3 retorna 300', () => {
    expect(xpAcumuladoParaNivel(3)).toBe(300);
  });

  it('nivel 5 retorna 1000', () => {
    expect(xpAcumuladoParaNivel(5)).toBe(1000);
  });

  it('nivel 10 retorna 4500', () => {
    expect(xpAcumuladoParaNivel(10)).toBe(4500);
  });

  it('nivel 11 retorna 6500', () => {
    expect(xpAcumuladoParaNivel(11)).toBe(6500);
  });

  it('nivel 20 retorna 69500', () => {
    expect(xpAcumuladoParaNivel(20)).toBe(69500);
  });

  it('xpAcumulado cresce monotonicamente', () => {
    let anterior = 0;
    for (let n = 2; n <= 20; n++) {
      const xp = xpAcumuladoParaNivel(n);
      expect(xp).toBeGreaterThan(anterior);
      anterior = xp;
    }
  });
});

// ── calcularNivelPorXP ──

describe('calcularNivelPorXP', () => {
  it('0 XP → nivel 1', () => {
    expect(calcularNivelPorXP(0)).toBe(1);
  });

  it('99 XP → nivel 1 (abaixo do threshold)', () => {
    expect(calcularNivelPorXP(99)).toBe(1);
  });

  it('100 XP → nivel 2 (exato no threshold)', () => {
    expect(calcularNivelPorXP(100)).toBe(2);
  });

  it('299 XP → nivel 2', () => {
    expect(calcularNivelPorXP(299)).toBe(2);
  });

  it('300 XP → nivel 3', () => {
    expect(calcularNivelPorXP(300)).toBe(3);
  });

  it('4500 XP → nivel 10', () => {
    expect(calcularNivelPorXP(4500)).toBe(10);
  });

  it('6499 XP → nivel 10', () => {
    expect(calcularNivelPorXP(6499)).toBe(10);
  });

  it('6500 XP → nivel 11', () => {
    expect(calcularNivelPorXP(6500)).toBe(11);
  });

  it('69500 XP → nivel 20', () => {
    expect(calcularNivelPorXP(69500)).toBe(20);
  });

  it('XP muito alto → nivel 20 (capped)', () => {
    expect(calcularNivelPorXP(999999)).toBe(20);
  });

  it('XP negativo → nivel 1', () => {
    expect(calcularNivelPorXP(-100)).toBe(1);
  });

  it('e consistente com xpAcumuladoParaNivel', () => {
    for (let n = 1; n <= 20; n++) {
      const xp = xpAcumuladoParaNivel(n);
      expect(calcularNivelPorXP(xp)).toBe(n);
    }
  });
});

// ── xpParaProximoNivel ──

describe('xpParaProximoNivel', () => {
  it('nivel 1 → proximo threshold e 100', () => {
    expect(xpParaProximoNivel(1)).toBe(100);
  });

  it('nivel 2 → proximo threshold e 300', () => {
    expect(xpParaProximoNivel(2)).toBe(300);
  });

  it('nivel 5 → proximo threshold e 1500', () => {
    expect(xpParaProximoNivel(5)).toBe(1500);
  });

  it('nivel 9 → proximo threshold e 4500', () => {
    expect(xpParaProximoNivel(9)).toBe(4500);
  });

  it('nivel 10 → proximo threshold e 6500', () => {
    expect(xpParaProximoNivel(10)).toBe(6500);
  });

  it('nivel 19 → proximo threshold e 69500', () => {
    expect(xpParaProximoNivel(19)).toBe(69500);
  });

  it('nivel 20 (max) retorna null', () => {
    expect(xpParaProximoNivel(20)).toBeNull();
  });

  it('nivel acima de 20 retorna null', () => {
    expect(xpParaProximoNivel(25)).toBeNull();
  });
});

// ── calcularPontosVantagem ──

describe('calcularPontosVantagem', () => {
  it('nivel 1, sem custos e sem desvantagens → 10', () => {
    expect(calcularPontosVantagem(1, 0, 0, 0)).toBe(10);
  });

  it('nivel 1, raca custo 3, classe custo 2, sem desvantagens → 5', () => {
    expect(calcularPontosVantagem(1, 3, 2, 0)).toBe(5);
  });

  it('desvantagens adicionam pontos', () => {
    // nivel 1 base 10, raca 2, classe 1, desvantagens 3
    expect(calcularPontosVantagem(1, 2, 1, 3)).toBe(10);
  });

  it('nivel 10 com custos e desvantagens', () => {
    // base=19, raca=4, classe=3, desvantagens=5 → 19-4-3+5=17
    expect(calcularPontosVantagem(10, 4, 3, 5)).toBe(17);
  });

  it('pode retornar valor negativo se custos excederem', () => {
    // base=10, raca=6, classe=6, desvantagens=0 → -2
    expect(calcularPontosVantagem(1, 6, 6, 0)).toBe(-2);
  });

  it('nivel 20 com custos zerados → 29', () => {
    expect(calcularPontosVantagem(20, 0, 0, 0)).toBe(29);
  });
});

// ── validarAtributos ──

describe('validarAtributos', () => {
  const atributosPadrao = {
    forca: 10,
    inteligencia: 10,
    carisma: 10,
    destreza: 10,
    constituicao: 10,
    agilidade: 10,
  };
  // soma = 10+10+10+10+10+10 = 60

  it('atributos validos nivel 1 (soma=60) → valido', () => {
    const result = validarAtributos(atributosPadrao, 1);
    expect(result.valido).toBe(true);
    expect(result.erros).toHaveLength(0);
  });

  it('atributo acima de 20 → erro', () => {
    const attrs = { ...atributosPadrao, forca: 21 };
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.length).toBeGreaterThan(0);
    expect(result.erros[0]).toContain('forca');
  });

  it('atributo abaixo de 1 → erro', () => {
    const attrs = { ...atributosPadrao, carisma: 0 };
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.some(e => e.includes('carisma'))).toBe(true);
  });

  it('soma excedendo o maximo → erro', () => {
    const attrs = {
      forca: 20,
      inteligencia: 20,
      carisma: 20,
      destreza: 20,
      constituicao: 20,
      agilidade: 20,
    };
    // soma = 120, max nivel 1 = 60
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.some(e => e.includes('excede'))).toBe(true);
  });

  it('nivel mais alto permite mais pontos de atributo', () => {
    const attrs = {
      forca: 12,
      inteligencia: 12,
      carisma: 11,
      destreza: 11,
      constituicao: 12,
      agilidade: 12,
    };
    // soma = 70, max nivel 1 = 60 → invalido, nivel 11 = 60+10=70 → valido
    expect(validarAtributos(attrs, 1).valido).toBe(false);
    expect(validarAtributos(attrs, 11).valido).toBe(true);
  });

  it('atributos faltantes sao tratados como 0', () => {
    const result = validarAtributos({}, 1);
    expect(result.valido).toBe(false);
    // Cada atributo sera 0, abaixo do minimo 1
    expect(result.erros.length).toBe(6);
  });

  it('atributos no limite exato sao validos', () => {
    const attrs = {
      forca: 1,
      inteligencia: 1,
      carisma: 1,
      destreza: 1,
      constituicao: 1,
      agilidade: 1,
    };
    // soma = 6, max nivel 1 = 60 → valido, todos entre 1 e 20
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(true);
  });

  it('todos em 20 no nivel 20 (soma=120 > max 78) → invalido', () => {
    const attrs = {
      forca: 20,
      inteligencia: 20,
      carisma: 20,
      destreza: 20,
      constituicao: 20,
      agilidade: 20,
    };
    const result = validarAtributos(attrs, 20);
    expect(result.valido).toBe(false);
    expect(result.erros.some(e => e.includes('excede'))).toBe(true);
  });

  it('multiplos erros simultaneos (valor fora do range e soma excedida)', () => {
    const attrs = {
      forca: 25,
      inteligencia: 25,
      carisma: 25,
      destreza: 25,
      constituicao: 25,
      agilidade: 25,
    };
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(false);
    // 6 erros de range + 1 erro de soma
    expect(result.erros.length).toBe(7);
  });
});

// ── validarVantagens ──

describe('validarVantagens', () => {
  it('vantagens vazio → valido', () => {
    const result = validarVantagens([], 10, 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(0);
  });

  it('vantagem dentro do orcamento e tier → valido', () => {
    const vantagens = [
      { nome: 'V1', custo: 3, nivel: 1 },
      { nome: 'V2', custo: 2, nivel: 1 },
    ];
    const result = validarVantagens(vantagens, 10, 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(5);
  });

  it('custo excedendo pontos disponiveis → erro', () => {
    const vantagens = [
      { nome: 'V1', custo: 6, nivel: 1 },
      { nome: 'V2', custo: 6, nivel: 1 },
    ];
    const result = validarVantagens(vantagens, 10, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.some(e => e.includes('excede'))).toBe(true);
    expect(result.custoTotal).toBe(12);
  });

  it('vantagem com tier acima do desbloqueado → erro', () => {
    const vantagens = [
      { nome: 'V Tier3', custo: 2, nivel: 3 },
    ];
    // nivel 1 = tier 1
    const result = validarVantagens(vantagens, 10, 1);
    expect(result.valido).toBe(false);
    expect(result.erros[0]).toContain('tier');
  });

  it('vantagem tier 2 no nivel 5 (tier 2) → valido', () => {
    const vantagens = [
      { nome: 'V Tier2', custo: 3, nivel: 2 },
    ];
    const result = validarVantagens(vantagens, 10, 5);
    expect(result.valido).toBe(true);
  });

  it('custo negativo usa valor absoluto', () => {
    const vantagens = [
      { nome: 'V1', custo: -5, nivel: 1 },
    ];
    const result = validarVantagens(vantagens, 4, 1);
    expect(result.valido).toBe(false);
    expect(result.custoTotal).toBe(5);
  });

  it('multiplos erros: tier e orcamento', () => {
    const vantagens = [
      { nome: 'V1', custo: 8, nivel: 5 },
      { nome: 'V2', custo: 8, nivel: 1 },
    ];
    const result = validarVantagens(vantagens, 5, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.length).toBe(2); // tier + orcamento
  });

  it('custo exato dos pontos disponiveis → valido', () => {
    const vantagens = [
      { nome: 'V1', custo: 5, nivel: 1 },
      { nome: 'V2', custo: 5, nivel: 1 },
    ];
    const result = validarVantagens(vantagens, 10, 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(10);
  });
});

// ── validarDesvantagens ──

describe('validarDesvantagens', () => {
  it('desvantagens vazio → valido', () => {
    const result = validarDesvantagens([], 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(0);
  });

  it('desvantagem dentro do limite e tier → valido', () => {
    const desvantagens = [
      { nome: 'D1', custo: 2, nivel: 1 },
    ];
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(2);
  });

  it('custo exato do maximo → valido', () => {
    // nivel 1, max = 3
    const desvantagens = [
      { nome: 'D1', custo: 1, nivel: 1 },
      { nome: 'D2', custo: 2, nivel: 1 },
    ];
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(3);
  });

  it('custo excedendo o limite → erro', () => {
    // nivel 1, max = 3
    const desvantagens = [
      { nome: 'D1', custo: 2, nivel: 1 },
      { nome: 'D2', custo: 2, nivel: 1 },
    ];
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.some(e => e.includes('excede'))).toBe(true);
    expect(result.custoTotal).toBe(4);
  });

  it('desvantagem com tier acima do desbloqueado → erro', () => {
    const desvantagens = [
      { nome: 'D Tier3', custo: 1, nivel: 3 },
    ];
    // nivel 1 = tier 1
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(false);
    expect(result.erros[0]).toContain('tier');
  });

  it('desvantagem tier 2 no nivel 5 (tier 2) → valido', () => {
    const desvantagens = [
      { nome: 'D Tier2', custo: 2, nivel: 2 },
    ];
    const result = validarDesvantagens(desvantagens, 5);
    expect(result.valido).toBe(true);
  });

  it('custo negativo usa valor absoluto', () => {
    const desvantagens = [
      { nome: 'D1', custo: -2, nivel: 1 },
      { nome: 'D2', custo: -2, nivel: 1 },
    ];
    // nivel 1, max = 3; custoTotal = 4
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(false);
    expect(result.custoTotal).toBe(4);
  });

  it('multiplos erros: tier e limite', () => {
    const desvantagens = [
      { nome: 'D1', custo: 3, nivel: 5 },
      { nome: 'D2', custo: 2, nivel: 1 },
    ];
    // nivel 1, tier 1, max 3, custoTotal 5
    const result = validarDesvantagens(desvantagens, 1);
    expect(result.valido).toBe(false);
    expect(result.erros.length).toBe(2);
  });

  it('nivel 5 permite max 4 de custo', () => {
    const desvantagens = [
      { nome: 'D1', custo: 2, nivel: 1 },
      { nome: 'D2', custo: 2, nivel: 1 },
    ];
    const result = validarDesvantagens(desvantagens, 5);
    expect(result.valido).toBe(true);
    expect(result.custoTotal).toBe(4);
  });
});

// ── verificarLevelUp ──

describe('verificarLevelUp', () => {
  it('nivel 20 (max) → nao pode evoluir', () => {
    const result = verificarLevelUp(20, 999999);
    expect(result.podeEvoluir).toBe(false);
    expect(result.xpNecessario).toBe(0);
    expect(result.ganhos).toBeNull();
  });

  it('XP insuficiente → nao pode evoluir', () => {
    // nivel 1 precisa de 100 XP
    const result = verificarLevelUp(1, 50);
    expect(result.podeEvoluir).toBe(false);
    expect(result.xpNecessario).toBe(100);
    expect(result.ganhos).toBeNull();
  });

  it('XP exato para subir de nivel 1 → 2', () => {
    const result = verificarLevelUp(1, 100);
    expect(result.podeEvoluir).toBe(true);
    expect(result.xpNecessario).toBe(100);
    expect(result.ganhos).not.toBeNull();
    expect(result.ganhos.novoNivel).toBe(2);
    expect(result.ganhos.xpRestante).toBe(0);
  });

  it('XP acima do necessario preserva restante', () => {
    const result = verificarLevelUp(1, 150);
    expect(result.podeEvoluir).toBe(true);
    expect(result.ganhos.xpRestante).toBe(50);
  });

  it('ganhos de nivel 1→2: pontos atributo 0, vantagem +1, tier nao muda', () => {
    const result = verificarLevelUp(1, 100);
    expect(result.ganhos.pontosAtributo).toBe(0); // bonus(2)-bonus(1) = 0-0 = 0
    expect(result.ganhos.pontosVantagem).toBe(1); // base(2)-base(1) = 11-10 = 1
    expect(result.ganhos.novoTier).toBe(1);
    expect(result.ganhos.tierMudou).toBe(false);
  });

  it('ganhos de nivel 2→3: pontos atributo +2', () => {
    const result = verificarLevelUp(2, 200);
    expect(result.podeEvoluir).toBe(true);
    expect(result.ganhos.novoNivel).toBe(3);
    expect(result.ganhos.pontosAtributo).toBe(2); // bonus(3)-bonus(2) = 2-0 = 2
    expect(result.ganhos.pontosVantagem).toBe(1);
  });

  it('ganhos de nivel 4→5: tier muda de 1 para 2', () => {
    // xpParaNivel(4) = XP[4]-XP[3] = 1000-600 = 400
    const result = verificarLevelUp(4, 400);
    expect(result.podeEvoluir).toBe(true);
    expect(result.ganhos.novoNivel).toBe(5);
    expect(result.ganhos.novoTier).toBe(2);
    expect(result.ganhos.tierMudou).toBe(true);
    expect(result.ganhos.pontosAtributo).toBe(2); // bonus(5)-bonus(4) = 4-2 = 2
  });

  it('ganhos de nivel 8→9: tier muda de 2 para 3', () => {
    // xpParaNivel(8) = XP[8]-XP[7] = 3600-2800 = 800
    const result = verificarLevelUp(8, 800);
    expect(result.podeEvoluir).toBe(true);
    expect(result.ganhos.novoNivel).toBe(9);
    expect(result.ganhos.novoTier).toBe(3);
    expect(result.ganhos.tierMudou).toBe(true);
  });

  it('xpProximoNivel no resultado e correto', () => {
    const result = verificarLevelUp(1, 100);
    expect(result.ganhos.xpProximoNivel).toBe(xpParaNivel(2));
  });

  it('nivel 19→20: xpProximoNivel e infinito', () => {
    // xpParaNivel(19) = 11000
    const result = verificarLevelUp(19, 11000);
    expect(result.podeEvoluir).toBe(true);
    expect(result.ganhos.novoNivel).toBe(20);
    expect(result.ganhos.xpProximoNivel).toBe(Number.POSITIVE_INFINITY);
  });

  it('novoMaxDesvantagem e consistente', () => {
    const result = verificarLevelUp(4, 400);
    expect(result.ganhos.novoMaxDesvantagem).toBe(maxCustoDesvantagem(5));
  });
});

// ── EVOLUCAO constantes ──

describe('EVOLUCAO constantes', () => {
  it('VANTAGEM_BASE = 10', () => {
    expect(EVOLUCAO.VANTAGEM_BASE).toBe(10);
  });

  it('ATRIBUTO_BASE = 75', () => {
    expect(EVOLUCAO.ATRIBUTO_BASE).toBe(60);
  });

  it('STAT_MAX = 20', () => {
    expect(EVOLUCAO.STAT_MAX).toBe(20);
  });

  it('STAT_MIN = 1', () => {
    expect(EVOLUCAO.STAT_MIN).toBe(1);
  });

  it('NIVEL_MAX = 20', () => {
    expect(EVOLUCAO.NIVEL_MAX).toBe(20);
  });
});

// ── Edge cases across functions ──

describe('edge cases gerais', () => {
  it('nivel 0 nas formulas de nivel (edge)', () => {
    // pontosVantagemBase(0) = 10 + (min(0,20)-1) = 10 + (-1) = 9
    expect(pontosVantagemBase(0)).toBe(9);
    // tierDesbloqueado(0) = 1 + floor((0-1)/4) = 1 + floor(-0.25) = 1 + (-1) = 0
    expect(tierDesbloqueado(0)).toBe(0);
    // maxCustoDesvantagem(0) = 3 + floor((0-1)/4) = 3 + (-1) = 2
    expect(maxCustoDesvantagem(0)).toBe(2);
  });

  it('nivel negativo nas formulas', () => {
    // pontosVantagemBase(-5) = 10 + (-5 - 1) = 4
    expect(pontosVantagemBase(-5)).toBe(4);
  });

  it('XP boundaries: exatamente no threshold vs 1 abaixo', () => {
    // threshold nivel 5 = 1000
    expect(calcularNivelPorXP(999)).toBe(4);
    expect(calcularNivelPorXP(1000)).toBe(5);
  });

  it('xpParaNivel incrementos crescem', () => {
    for (let n = 2; n <= 19; n++) {
      expect(xpParaNivel(n)).toBeGreaterThan(xpParaNivel(n - 1));
    }
  });

  it('niveis altos: consistencia entre xp e nivel', () => {
    for (let n = 1; n <= 20; n++) {
      const xpAcum = xpAcumuladoParaNivel(n);
      expect(calcularNivelPorXP(xpAcum)).toBe(n);
    }
  });

  it('xpParaProximoNivel e consistente com xpAcumuladoParaNivel', () => {
    for (let n = 1; n <= 19; n++) {
      expect(xpParaProximoNivel(n)).toBe(xpAcumuladoParaNivel(n + 1));
    }
  });

  it('verificarLevelUp com nivel 21 (acima do max) → nao pode evoluir', () => {
    const result = verificarLevelUp(21, 999999);
    expect(result.podeEvoluir).toBe(false);
  });

  it('validarAtributos com strings numericas', () => {
    const attrs = {
      forca: '10',
      inteligencia: '10',
      carisma: '10',
      destreza: '10',
      constituicao: '10',
      agilidade: '10',
    };
    const result = validarAtributos(attrs, 1);
    expect(result.valido).toBe(true);
  });

  it('pontosAtributoBonus nivel grande (capped a 20)', () => {
    expect(pontosAtributoBonus(50)).toBe(pontosAtributoBonus(20));
  });
});
