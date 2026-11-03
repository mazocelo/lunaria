// src/__tests__/wizard/StageFrame.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StageFrame from '../../Pages/Personagem/Wizard/components/StageFrame';
import WizardFooter from '../../Pages/Personagem/Wizard/components/WizardFooter';

describe('StageFrame', () => {
  it('título em font-fantasy, flavor em itálico e direção na variável CSS', () => {
    const html = renderToStaticMarkup(
      <StageFrame etapaId="raca" titulo="Raça" flavor="A linhagem que molda o seu herói." direcao={-1} isLight={false}><p>conteudo</p></StageFrame>,
    );
    expect(html).toMatch(/<h2[^>]*font-fantasy[^>]*>Raça<\/h2>/);
    expect(html).toMatch(/<p[^>]*italic[^>]*>A linhagem que molda o seu herói\.<\/p>/);
    expect(html).toContain('--wz-dir:-1');
    expect(html).toContain('conteudo');
  });
});

describe('WizardFooter', () => {
  const base = { etapasTotal: 10, podeContinuar: true, enviando: false, onVoltar: () => {}, onContinuar: () => {}, isLight: false };

  it('na primeira etapa não mostra Voltar e nomeia a próxima', () => {
    const html = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={0} proximaLabel="Raça" />);
    expect(html).not.toContain('Voltar');
    expect(html).toContain('Continuar: Raça');
  });

  it('na última etapa o botão vira Finalizar', () => {
    const html = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={9} proximaLabel={null} />);
    expect(html).toContain('Voltar');
    expect(html).toContain('>Finalizar<');
  });

  it('desabilita Continuar quando não pode continuar ou está enviando', () => {
    const a = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={1} proximaLabel="Classe" podeContinuar={false} />);
    const b = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={1} proximaLabel="Classe" enviando={true} />);
    const ok = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={1} proximaLabel="Classe" />);
    expect(a).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
    expect(b).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
    expect(ok).not.toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
  });

  it('mostra Pular etapa só quando onPular existe', () => {
    const sem = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={1} proximaLabel="Classe" />);
    const com = renderToStaticMarkup(<WizardFooter {...base} etapaIndex={1} proximaLabel="Classe" onPular={() => {}} />);
    expect(sem).not.toContain('Pular etapa');
    expect(com).toContain('Pular etapa');
  });
});

describe('WizardFooter: rótulo e motivo', () => {
  const base = { etapaIndex: 6, etapasTotal: 10, proximaLabel: 'Equipamentos', podeContinuar: false, enviando: false, onVoltar: () => {}, onContinuar: () => {}, isLight: false };

  it('desabilitado mostra o motivo ligado ao botão', () => {
    const html = renderToStaticMarkup(<WizardFooter {...base} rotuloContinuar="Confirmar magias" motivoBloqueio="Distribua mais 3 pts" />);
    expect(html).toContain('Confirmar magias');
    expect(html).toMatch(/data-acao="continuar"[^>]*aria-describedby="rodape-motivo"/);
    expect(html).toMatch(/id="rodape-motivo"[^>]*>Distribua mais 3 pts</);
  });

  it('habilitado não mostra motivo e usa o rótulo padrão', () => {
    const html = renderToStaticMarkup(<WizardFooter {...base} podeContinuar motivoBloqueio="x" />);
    expect(html).not.toContain('rodape-motivo');
    expect(html).toContain('Continuar: Equipamentos');
  });

  it('enviando não mostra motivo', () => {
    const html = renderToStaticMarkup(<WizardFooter {...base} enviando motivoBloqueio="Distribua mais 3 pts" />);
    expect(html).not.toContain('rodape-motivo');
  });
});

describe('StageFrame: título focável', () => {
  it('h2 com id fixo e tabindex -1, e a seção rotulada por ele', () => {
    const html = renderToStaticMarkup(<StageFrame etapaId="raca" titulo="Raça" flavor="" direcao={1} isLight={false}><p>x</p></StageFrame>);
    expect(html).toMatch(/<h2[^>]*id="etapa-titulo"[^>]*tabindex="-1"|<h2[^>]*tabindex="-1"[^>]*id="etapa-titulo"/);
    expect(html).toContain('aria-labelledby="etapa-titulo"');
  });
});
