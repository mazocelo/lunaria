import { describe, it, expect } from 'vitest';
import { extrairBonusEquipamentos } from '../game-systems/tresdet/equipmentEngine.js';

describe('tresdet extrairBonusEquipamentos', () => {
  it('retorna zeros para array vazio', () => {
    const result = extrairBonusEquipamentos([]);
    expect(result).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
  });

  it('extrai bonus de Arma Mágica +1', () => {
    const itens = [{ nome: 'Arma Mágica: Bônus Mágico +1', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(1);
    expect(result.PdF).toBe(1);
  });

  it('extrai bonus de Arma Mágica +3', () => {
    const itens = [{ nome: 'Arma Mágica: Bônus Mágico +3', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(3);
    expect(result.PdF).toBe(3);
  });

  it('extrai bonus de Armadura Mágica +2', () => {
    const itens = [{ nome: 'Armadura Mágica: Bônus Mágico +2', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.A).toBe(2);
  });

  it('extrai bonus de Arma Veloz', () => {
    const itens = [{ nome: 'Arma Mágica: Veloz', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.iniciativa).toBe(2);
  });

  it('extrai Flagelo como especial', () => {
    const itens = [{ nome: 'Arma Mágica: Flagelo (Humanos)', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'flagelo', alvo: 'Humanos', bonus: 1 });
  });

  it('extrai Armadura Extra como especial', () => {
    const itens = [{ nome: 'Armadura Mágica: Armadura Extra (Fogo)', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'armadura_extra', elemento: 'Fogo' });
  });

  it('extrai Invulnerável como especial', () => {
    const itens = [{ nome: 'Armadura Mágica: Invulnerável (Frio)', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'invulneravel', elemento: 'Frio' });
  });

  it('extrai Ataque Especial como especial', () => {
    const itens = [{ nome: 'Arma Mágica: Ataque Especial', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'ataque_especial', bonus: 2, usos: 1 });
  });

  it('agrega múltiplos itens', () => {
    const itens = [
      { nome: 'Arma Mágica: Bônus Mágico +2', tipo: 'arma' },
      { nome: 'Armadura Mágica: Bônus Mágico +1', tipo: 'armadura' },
      { nome: 'Arma Mágica: Veloz', tipo: 'arma' },
    ];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(2);
    expect(result.PdF).toBe(2);
    expect(result.A).toBe(1);
    expect(result.iniciativa).toBe(2);
  });

  it('ignora itens sem padrão reconhecido', () => {
    const itens = [
      { nome: 'Anel de Anulação', tipo: 'acessorio' },
      { nome: 'Medalhão de Arcanys', tipo: 'acessorio' },
    ];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(0);
    expect(result.A).toBe(0);
  });

  it('retorna zeros para input null/undefined', () => {
    expect(extrairBonusEquipamentos(null)).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
    expect(extrairBonusEquipamentos(undefined)).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
  });
});
