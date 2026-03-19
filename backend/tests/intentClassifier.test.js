import { describe, it, expect } from 'vitest';
import { validarIntentLLM, buildClassifierPrompt } from '../helpers/intentClassifier.js';

function makePersonagem() {
  return {
    habilidades: [
      { id: 'investida', nome: 'Investida', custo_mana: 3, dano_base: '1d8' },
    ],
    magias: [
      { id: 'luz_divina', nome: 'Luz Divina', custo_mana: 5, dano_base: '2d6', elemento: 'sagrado' },
    ],
  };
}

function makeCombate() {
  return {
    ativo: true,
    monstros: [
      { id: 'dretch_0', nome: 'Dretch', status: 'vivo', hp_atual: 25 },
      { id: 'dretch_1', nome: 'Dretch', status: 'derrotado', hp_atual: 0 },
    ],
  };
}

describe('intentClassifier', () => {
  describe('validarIntentLLM', () => {
    const personagem = makePersonagem();
    const combate = makeCombate();

    it('valida JSON com magia existente', () => {
      const raw = '{"tipo":"conjurar_magia","id":"luz_divina","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('conjurar_magia');
      expect(result.magiaId).toBe('luz_divina');
      expect(result.alvoId).toBe('dretch_0');
    });

    it('valida JSON com habilidade existente', () => {
      const raw = '{"tipo":"usar_habilidade","id":"investida","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('usar_habilidade');
      expect(result.habilidadeId).toBe('investida');
    });

    it('valida ataque genérico (sem id)', () => {
      const raw = '{"tipo":"atacar","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('atacar');
    });

    it('valida defender (sem id, sem alvo)', () => {
      const raw = '{"tipo":"defender"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('defender');
    });

    it('retorna null para JSON inválido', () => {
      expect(validarIntentLLM('not json', personagem, combate)).toBeNull();
      expect(validarIntentLLM('', personagem, combate)).toBeNull();
      expect(validarIntentLLM(null, personagem, combate)).toBeNull();
    });

    it('retorna null para tipo inválido', () => {
      const raw = '{"tipo":"dançar","id":"investida"}';
      expect(validarIntentLLM(raw, personagem, combate)).toBeNull();
    });

    it('retorna null para habilidade inexistente', () => {
      const raw = '{"tipo":"usar_habilidade","id":"golpe_fantasma"}';
      expect(validarIntentLLM(raw, personagem, combate)).toBeNull();
    });

    it('usa primeiro monstro vivo quando alvo não existe', () => {
      const raw = '{"tipo":"atacar","alvo":"goblin_99"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.alvoId).toBe('dretch_0');
    });

    it('ignora monstros derrotados ao selecionar alvo', () => {
      const raw = '{"tipo":"atacar","alvo":"dretch_1"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result.alvoId).toBe('dretch_0');
    });
  });

  describe('buildClassifierPrompt', () => {
    it('gera prompt com habilidades e monstros', () => {
      const prompt = buildClassifierPrompt('uso meu poder sagrado', makePersonagem(), makeCombate());
      expect(prompt).toContain('Luz Divina');
      expect(prompt).toContain('luz_divina');
      expect(prompt).toContain('Dretch');
      expect(prompt).toContain('dretch_0');
      expect(prompt).not.toContain('dretch_1');
      expect(prompt).toContain('uso meu poder sagrado');
    });

    it('inclui candidatos quando fornecidos', () => {
      const prompt = buildClassifierPrompt('investida', makePersonagem(), makeCombate(), ['Investida', 'Investida Brutal']);
      expect(prompt).toContain('Candidatos ambíguos');
      expect(prompt).toContain('Investida');
      expect(prompt).toContain('Investida Brutal');
    });
  });
});
