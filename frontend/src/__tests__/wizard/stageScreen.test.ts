// src/__tests__/wizard/stageScreen.test.ts
import { describe, it, expect } from 'vitest';
import { telaDaEtapa, regraDoRodape, type EstadoDoRodape } from '../../Pages/Personagem/Wizard/stages/stageScreen';
import { getSystemStages } from '../../Pages/Personagem/Wizard/stages/stageConfig';

const vazio: EstadoDoRodape = {
  nome: '', racaId: null, classeId: null, background: '',
  vantagensIds: [], desvantagensIds: [], skipVantagens: false, skipDesvantagens: false,
  bonusAplicados: false, pontosRestantes: 3,
  dndAbilitiesConfirmed: false, dndAtribuidos: 0, dndSkillsConfirmed: false, dndPericiasEscolhidas: 0, dndPericiasMax: 2,
  comboPronto: false, comboCarregando: false, grimorioEscolhidas: 0, grimorioErro: false, pendencias: [],
};

describe('telaDaEtapa', () => {
  it('lunaria: toda etapa tem tela própria', () => {
    expect(getSystemStages('lunaria').stages.map((s) => telaDaEtapa(s.id, 'lunaria'))).toEqual([
      'nome', 'catalogo-raca', 'catalogo-classe', 'background', 'catalogo-desvantagem',
      'catalogo-vantagem', 'atributos', 'equipamentos', 'grimorio', 'resumo',
    ]);
  });
  it('dnd5e: atributos e perícias usam os blocos D&D', () => {
    expect(getSystemStages('dnd5e').stages.map((s) => telaDaEtapa(s.id, 'dnd5e')))
      .toEqual(['nome', 'catalogo-raca', 'catalogo-classe', 'background', 'dnd-atributos', 'dnd-pericias', 'resumo']);
  });
  it('id desconhecido (rascunho antigo) cai no Nome', () => {
    expect(telaDaEtapa('inexistente', 'lunaria')).toBe('nome');
  });
});

describe('regraDoRodape', () => {
  it('nome: só avança com nome', () => {
    expect(regraDoRodape('nome', vazio).motivoBloqueio).toBe('Escreva o nome do herói');
    expect(regraDoRodape('nome', { ...vazio, nome: 'Ayla' }).podeContinuar).toBe(true);
  });
  it('background: Continuar pelo Mestre só com texto, e diz por quê', () => {
    expect(regraDoRodape('background', vazio)).toEqual({ acao: 'mestre', podeContinuar: false, motivoBloqueio: 'Escreva ou escolha um background', rotulo: null, pular: null });
    expect(regraDoRodape('background', { ...vazio, background: 'Órfã do porto' })).toMatchObject({ podeContinuar: true, motivoBloqueio: null });
  });
  it('raça e classe: só avança com escolha', () => {
    expect(regraDoRodape('catalogo-raca', vazio).motivoBloqueio).toBe('Escolha uma raça');
    expect(regraDoRodape('catalogo-classe', { ...vazio, classeId: 0 }).podeContinuar).toBe(true);
  });
  it('vantagens: Pular sempre; Continuar com escolha ou depois de pular', () => {
    expect(regraDoRodape('catalogo-vantagem', vazio)).toMatchObject({ acao: 'mestre', podeContinuar: false, pular: 'vantagens', motivoBloqueio: 'Escolha uma vantagem ou pule a etapa' });
    expect(regraDoRodape('catalogo-vantagem', { ...vazio, vantagensIds: [7] }).podeContinuar).toBe(true);
    expect(regraDoRodape('catalogo-desvantagem', { ...vazio, skipDesvantagens: true })).toMatchObject({ podeContinuar: true, pular: 'desvantagens' });
  });
  // Decisão do dono: um clique só. O Continuar do rodapé confirma os atributos e avança (sem rótulo próprio).
  it('atributos lunaria: Continuar confirma e avança (diz quanto falta); depois de aplicado só avança', () => {
    expect(regraDoRodape('atributos', vazio)).toMatchObject({ acao: 'confirmar-atributos', podeContinuar: false, rotulo: null, motivoBloqueio: 'Distribua mais 3 pts' });
    expect(regraDoRodape('atributos', { ...vazio, pontosRestantes: 1 }).motivoBloqueio).toBe('Distribua mais 1 pt');
    expect(regraDoRodape('atributos', { ...vazio, pontosRestantes: -2 }).motivoBloqueio).toBe('Retire 2 pts');
    expect(regraDoRodape('atributos', { ...vazio, pontosRestantes: 0 })).toMatchObject({ acao: 'confirmar-atributos', podeContinuar: true, rotulo: null });
    expect(regraDoRodape('atributos', { ...vazio, bonusAplicados: true })).toMatchObject({ acao: 'mestre', podeContinuar: true, rotulo: null });
  });
  it('D&D: confirma no rodapé; confirmado avança local', () => {
    expect(regraDoRodape('dnd-atributos', { ...vazio, dndAtribuidos: 4 })).toMatchObject({ acao: 'confirmar-dnd-atributos', podeContinuar: false, motivoBloqueio: 'Atribua os 2 valores restantes' });
    expect(regraDoRodape('dnd-atributos', { ...vazio, dndAbilitiesConfirmed: true })).toMatchObject({ acao: 'local', podeContinuar: true });
    expect(regraDoRodape('dnd-pericias', { ...vazio, dndPericiasEscolhidas: 1 })).toMatchObject({ acao: 'confirmar-dnd-pericias', motivoBloqueio: 'Escolha mais 1 perícia' });
    expect(regraDoRodape('dnd-pericias', { ...vazio, dndPericiasEscolhidas: 2 }).podeContinuar).toBe(true);
  });
  it('equipamentos: espera o arsenal e explica', () => {
    expect(regraDoRodape('equipamentos', { ...vazio, comboCarregando: true }).motivoBloqueio).toBe('Montando o arsenal…');
    expect(regraDoRodape('equipamentos', vazio).motivoBloqueio).toBe('O arsenal não carregou. Use "Tentar de novo" acima.');
    expect(regraDoRodape('equipamentos', { ...vazio, comboPronto: true })).toMatchObject({ acao: 'mestre', podeContinuar: true });
  });
  it('magias: confirma no rodapé; erro de carga bloqueia com motivo', () => {
    expect(regraDoRodape('grimorio', vazio)).toMatchObject({ acao: 'confirmar-grimorio', podeContinuar: false, rotulo: 'Confirmar magias', motivoBloqueio: 'Escolha ao menos uma magia' });
    expect(regraDoRodape('grimorio', { ...vazio, grimorioErro: true }).motivoBloqueio).toBe('O grimório não carregou. Use "Tentar de novo" acima.');
  });
  it('finalizar: cria com o nome e mostra a primeira pendência', () => {
    expect(regraDoRodape('resumo', { ...vazio, nome: 'Ayla', pendencias: ['Atributos: confirme a distribuição', 'Saldo negativo'] }))
      .toEqual({ acao: 'criar', podeContinuar: false, motivoBloqueio: 'Antes de criar: Atributos: confirme a distribuição (+1)', rotulo: 'Criar Ayla', pular: null });
    expect(regraDoRodape('resumo', { ...vazio, nome: 'Ayla' })).toMatchObject({ podeContinuar: true, motivoBloqueio: null });
  });
});
