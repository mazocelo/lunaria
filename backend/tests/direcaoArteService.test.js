import { describe, it, expect } from 'vitest';
import { _internos } from '../services/direcaoArteService.js';

const { extrairJson, normalizar } = _internos;

/**
 * A direcao de arte vem de um LLM, entao a saida e texto e chega torta na
 * pratica. Estes testes cobrem o parsing e a sanitizacao — o caminho de rede
 * fica de fora de proposito (a suite do backend nao chama LLM).
 *
 * A regra que orienta tudo: campo invalido e DESCARTADO, nao propagado. O
 * frontend funde o que sobrou sobre o default do tipo, campo a campo, entao uma
 * direcao parcial ainda e util. Deixar passar um valor invalido seria pior:
 * uma cor quebrada vira material preto no three.js sem erro nenhum.
 */

describe('extrairJson', () => {
  it('le JSON cru', () => {
    expect(extrairJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('le JSON embrulhado em cerca de codigo', () => {
    expect(extrairJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('le JSON com texto solto em volta', () => {
    expect(extrairJson('Claro! Aqui esta:\n{"a":1}\nEspero que ajude.')).toEqual({ a: 1 });
  });

  it('devolve null para lixo', () => {
    expect(extrairJson('sem json aqui')).toBeNull();
    expect(extrairJson('')).toBeNull();
    expect(extrairJson(null)).toBeNull();
    expect(extrairJson('{quebrado')).toBeNull();
  });
});

describe('normalizar', () => {
  const completo = {
    paleta: { piso: '#8B95A6', parede: '#626D80', acento: '#F59E0B', ambiente: '#1A2336' },
    materiais: { textura: 'pedra', rugosidade: 0.9, metalico: 0.05 },
    atmosfera: { luzCor: '#FFD9A0', luzIntensidade: 1.3, nevoaDensidade: 0.4 },
  };

  it('aceita uma direcao completa e normaliza caixa das cores', () => {
    const r = normalizar(completo);
    expect(r.paleta.piso).toBe('#8b95a6');
    expect(r.materiais.textura).toBe('pedra');
    expect(r.atmosfera.luzIntensidade).toBe(1.3);
  });

  it('descarta cor invalida mas mantem as validas', () => {
    const r = normalizar({
      ...completo,
      paleta: { ...completo.paleta, piso: 'azul escuro', parede: '#626D80' },
    });
    expect(r.paleta.piso).toBeUndefined();
    expect(r.paleta.parede).toBe('#626d80');
  });

  it('descarta textura fora do vocabulario', () => {
    const r = normalizar({ ...completo, materiais: { ...completo.materiais, textura: 'lava' } });
    expect(r.materiais.textura).toBeUndefined();
    expect(r.materiais.rugosidade).toBe(0.9);
  });

  it('limita numeros a faixa em vez de descartar', () => {
    const r = normalizar({
      ...completo,
      materiais: { ...completo.materiais, rugosidade: 5, metalico: -2 },
      atmosfera: { ...completo.atmosfera, luzIntensidade: 99 },
    });
    expect(r.materiais.rugosidade).toBe(1);
    expect(r.materiais.metalico).toBe(0);
    // Teto em 3: acima disso a cena estoura em branco e o mapa fica ilegivel.
    expect(r.atmosfera.luzIntensidade).toBe(3);
  });

  it('aceita direcao parcial — util para fundir sobre o default', () => {
    const r = normalizar({ paleta: { acento: '#ff0000' } });
    expect(r).toEqual({ paleta: { acento: '#ff0000' } });
  });

  it('devolve null quando nada sobra', () => {
    expect(normalizar({ paleta: { piso: 'roxo' }, materiais: { textura: 'lava' } })).toBeNull();
    expect(normalizar({})).toBeNull();
    expect(normalizar(null)).toBeNull();
    expect(normalizar('texto')).toBeNull();
  });

  it('aceita hex de 3 digitos', () => {
    expect(normalizar({ paleta: { piso: '#abc' } }).paleta.piso).toBe('#abc');
  });
});
