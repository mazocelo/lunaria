// src/__tests__/wizard/draft.test.ts
import { describe, it, expect } from 'vitest';
import {
  chaveDoRascunho, lerRascunho, existeRascunho, gravarRascunho, saneamentoDoRascunho,
} from '../../Pages/Personagem/Wizard/hooks/useDraftPersistence';

const mem = (dados: Record<string, string>) => ({
  getItem: (k: string) => dados[k] ?? null,
  removeItem: (k: string) => { delete dados[k]; },
  setItem: (k: string, v: string) => { dados[k] = v; },
});

describe('rascunho por sistema', () => {
  it('chaves separadas', () => {
    expect(chaveDoRascunho('dnd5e')).toBe('lunaria_wizard_draft_v3_dnd5e');
    expect(chaveDoRascunho('lunaria')).not.toBe(chaveDoRascunho('dnd5e'));
  });
  it('rascunho de Lunaria não abre no D&D', () => {
    const s = mem({ lunaria_wizard_draft_v3_lunaria: JSON.stringify({ sistema: 'lunaria', versao: 3, nome: 'Ayla', etapaAtual: 'raca' }) });
    expect(lerRascunho('dnd5e', s)).toBeNull();
    expect(lerRascunho('lunaria', s)?.nome).toBe('Ayla');
  });
  it('rejeita conteúdo de outro sistema na chave errada', () => {
    const s = mem({ lunaria_wizard_draft_v3_dnd5e: JSON.stringify({ sistema: 'lunaria', versao: 3, nome: 'X' }) });
    expect(lerRascunho('dnd5e', s)).toBeNull();
  });
  it('JSON corrompido ou não-objeto vira null', () => {
    expect(lerRascunho('lunaria', mem({ lunaria_wizard_draft_v3_lunaria: '{quebrado' }))).toBeNull();
    expect(lerRascunho('lunaria', mem({ lunaria_wizard_draft_v3_lunaria: '"texto"' }))).toBeNull();
  });
  it('migra o v2 só para lunaria e apaga a chave velha', () => {
    const dados: Record<string, string> = { lunaria_wizard_draft_v2: JSON.stringify({ nome: 'Velho', etapaAtual: 'classe' }) };
    expect(lerRascunho('dnd5e', mem(dados))).toBeNull();
    expect(lerRascunho('lunaria', mem(dados))?.nome).toBe('Velho');
    expect(dados.lunaria_wizard_draft_v2).toBeUndefined();
    // segunda leitura (StrictMode) acha o migrado na chave nova
    expect(lerRascunho('lunaria', mem(dados))?.nome).toBe('Velho');
  });
  it('preserva campos D&D, grimório e retrato', () => {
    const d = { sistema: 'dnd5e', versao: 3, nome: 'Bram', dndAbilityScores: { STR: 15 }, dndSkillsConfirmed: true, grimorioSelecionadas: [3], imageUrl: 'http://x' };
    expect(lerRascunho('dnd5e', mem({ lunaria_wizard_draft_v3_dnd5e: JSON.stringify(d) }))).toMatchObject(d);
  });
  it('existeRascunho resume nome e etapa', () => {
    const s = mem({ lunaria_wizard_draft_v3_lunaria: JSON.stringify({ sistema: 'lunaria', versao: 3, nome: 'Ayla', etapaAtual: 'atributos' }) });
    expect(existeRascunho('lunaria', s)).toEqual({ nome: 'Ayla', etapa: 'atributos' });
    expect(existeRascunho('dnd5e', s)).toBeNull();
  });
});

describe('gravarRascunho', () => {
  it('grava o objeto inteiro, com sistema e versão, na chave do sistema', () => {
    const dados: Record<string, string> = {};
    gravarRascunho('dnd5e', { etapaAtual: 'skills', nome: 'Bram', dndSkillProficiencies: ['athletics'], grimorioSelecionadas: ['7'], grimorioConfirmado: true, imageUrl: 'http://y' }, mem(dados));
    expect(JSON.parse(dados.lunaria_wizard_draft_v3_dnd5e)).toEqual({
      etapaAtual: 'skills', nome: 'Bram', dndSkillProficiencies: ['athletics'], grimorioSelecionadas: ['7'], grimorioConfirmado: true, imageUrl: 'http://y', sistema: 'dnd5e', versao: 3,
    });
  });
  it('não grava rascunho vazio na abertura', () => {
    const dados: Record<string, string> = {};
    gravarRascunho('lunaria', { etapaAtual: 'boas_vindas', nome: '' }, mem(dados));
    expect(dados).toEqual({});
  });
});

describe('saneamentoDoRascunho', () => {
  it('raça fora do catálogo do sistema: zera e volta para Raça', () => {
    expect(saneamentoDoRascunho({ racaId: 99, classeId: 2 }, [1, 2], [2])).toEqual({ zerarRaca: true, zerarClasse: false, voltarPara: 'raca' });
  });
  it('só a classe fora: zera a classe e volta para Classe', () => {
    expect(saneamentoDoRascunho({ racaId: '1', classeId: 5 }, [1], [2])).toEqual({ zerarRaca: false, zerarClasse: true, voltarPara: 'classe' });
  });
  it('tudo válido (ids como string ou número) ou nada escolhido: nada muda', () => {
    expect(saneamentoDoRascunho({ racaId: '1', classeId: 2 }, [1], ['2'])).toEqual({ zerarRaca: false, zerarClasse: false, voltarPara: null });
    expect(saneamentoDoRascunho({ racaId: null, classeId: null }, [], [])).toEqual({ zerarRaca: false, zerarClasse: false, voltarPara: null });
  });
  it('catálogo ainda não conhecido (null) não derruba a escolha', () => {
    expect(saneamentoDoRascunho({ racaId: 99, classeId: 5 }, null, null)).toEqual({ zerarRaca: false, zerarClasse: false, voltarPara: null });
  });
});
