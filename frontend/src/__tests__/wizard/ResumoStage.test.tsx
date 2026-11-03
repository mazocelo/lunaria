// src/__tests__/wizard/ResumoStage.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ResumoStage from '../../Pages/Personagem/Wizard/stages/ResumoStage';
import { listarPendencias } from '../../Pages/Personagem/Wizard/stages/pendencias';
import DestinoResolutivaBlock from '../../Pages/Personagem/Wizard/components/DestinoResolutivaBlock';
import { montar, clicar } from '../helpers/montar';

const ok = { sistema: 'lunaria', nome: 'Ayla', racaId: 1, classeId: 2, background: 'x', vantagensIds: [1], desvantagensIds: [], skipVantagens: false, skipDesvantagens: true, bonusAplicados: true, comboPronto: true, pontosCriacaoRestantes: 0, dndAbilitiesConfirmed: false, dndSkillsConfirmed: false };

describe('listarPendencias', () => {
  it('saldo negativo vem primeiro', () => {
    expect(listarPendencias({ ...ok, pontosCriacaoRestantes: -2, bonusAplicados: false }).map((p) => p.texto))
      .toEqual(['Saldo negativo: remova 2 pts em Vantagens', 'Atributos: confirme a distribuição']);
  });
  it('lunaria completa não tem pendência; D&D usa as próprias etapas', () => {
    expect(listarPendencias(ok)).toEqual([]);
    expect(listarPendencias({ ...ok, sistema: 'dnd5e', comboPronto: false }).map((p) => p.etapa)).toEqual(['atributos', 'skills']);
  });
  it('faltando tudo: na ordem do fluxo, cada uma com a sua etapa', () => {
    const vazio = { ...ok, nome: ' ', racaId: null, classeId: null, background: '', vantagensIds: [], skipDesvantagens: false, bonusAplicados: false, comboPronto: false };
    expect(listarPendencias(vazio).map((p) => p.etapa))
      .toEqual(['boas_vindas', 'raca', 'classe', 'background', 'desvantagens', 'vantagens', 'atributos', 'equipamentos']);
  });
});

describe('ResumoStage', () => {
  const base = { pendencias: [], onResolver: () => {}, escolhas: [{ titulo: 'Vantagens', etapa: 'vantagens', itens: [{ nome: 'Riqueza', detalhe: 'Custa 4 pts' }] }], onEditar: () => {}, leitura: <p>LEITURA</p>, ficha: <p>FICHA</p>, isLight: false };
  it('mostra escolhas com Editar, leitura e ficha; sem botão Criar', () => {
    const html = renderToStaticMarkup(<ResumoStage {...base} />);
    expect(html).toContain('Riqueza');
    expect(html).toContain('Custa 4 pts');
    expect(html).toContain('data-editar="vantagens"');
    expect(html).toContain('LEITURA');
    expect(html).toContain('FICHA');
    expect(html).not.toContain('Criar');
    expect(html).not.toContain('Antes de criar');
  });
  it('pendências com Resolver', () => {
    const html = renderToStaticMarkup(<ResumoStage {...base} pendencias={[{ etapa: 'atributos', texto: 'Atributos: confirme a distribuição' }]} />);
    expect(html).toContain('Antes de criar');
    expect(html).toMatch(/data-resolver="atributos"/);
  });
  it('Resolver e Editar levam à etapa', () => {
    const chamadas: string[] = [];
    const m = montar(<ResumoStage {...base} pendencias={[{ etapa: 'atributos', texto: 'Atributos: confirme' }]}
      onResolver={(e) => chamadas.push(`resolver:${e}`)} onEditar={(e) => chamadas.push(`editar:${e}`)} />);
    clicar(m.container.querySelector('[data-resolver="atributos"]'));
    clicar(m.container.querySelector('[data-editar="vantagens"]'));
    expect(chamadas).toEqual(['resolver:atributos', 'editar:vantagens']);
    m.desmontar();
  });
});

describe('DestinoResolutivaBlock (criar só pelo rodapé)', () => {
  const data = { combo: { equipamentos: [{ id: 1, nome: 'Espada' }] }, snapshot: { nome: 'Ayla', atributos: { forca: 12 } } };
  it('sem botão Criar e sem barra fixa no rodapé', () => {
    const html = renderToStaticMarkup(<DestinoResolutivaBlock data={data} isLight={false} />);
    expect(html).toContain('Espada');
    expect(html).not.toContain('Criar personagem');
    expect(html).not.toContain('fixed bottom-0');
  });
  it('erro da resolutiva e do retrato com role="alert" e Tentar de novo', () => {
    const html = renderToStaticMarkup(
      <DestinoResolutivaBlock data={data} error="Timeout na requisição" onRetry={() => {}} imageError="falhou" onGerarImagem={() => {}} isLight={false} />,
    );
    expect(html).toMatch(/role="alert"[\s\S]*O Mestre demorou demais para responder/);
    expect(html).not.toContain('Timeout na requisição');
    expect((html.match(/role="alert"/g) ?? []).length).toBe(2);
    expect((html.match(/Tentar de novo/g) ?? []).length).toBe(2);
  });
});
