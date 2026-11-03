// src/__tests__/wizard/Stepper.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Stepper from '../../Pages/Personagem/Wizard/components/Stepper';

const etapas = [
  { id: 'boas_vindas', label: 'Nome', icon: '✨' },
  { id: 'raca', label: 'Raça', icon: '👑' },
  { id: 'classe', label: 'Classe', icon: '⚔️' },
];

describe('Stepper', () => {
  it('mostra contador, nomes e marca a etapa atual', () => {
    const html = renderToStaticMarkup(
      <Stepper etapas={etapas} etapaIndex={1} etapasConcluidas={['boas_vindas']} etapasVisitadas={['boas_vindas', 'raca']} onEtapaClick={() => {}} isLight={false} />,
    );
    expect(html).toContain('Etapa 2 de 3');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('>Raça<');
  });

  it('etapa concluída tem check e etapa não visitada fica desabilitada', () => {
    const html = renderToStaticMarkup(
      <Stepper etapas={etapas} etapaIndex={1} etapasConcluidas={['boas_vindas']} etapasVisitadas={['boas_vindas', 'raca']} onEtapaClick={() => {}} isLight={false} />,
    );
    expect(html).toContain('data-estado="concluida"');
    expect(html).toMatch(/data-etapa="classe"[^>]*\sdisabled=""/);
    expect(html).not.toMatch(/data-etapa="boas_vindas"[^>]*\sdisabled=""/);
  });

  it('etapa pulada ganha o sufixo (pulada)', () => {
    const html = renderToStaticMarkup(
      <Stepper etapas={etapas} etapaIndex={2} etapasConcluidas={['boas_vindas', 'raca']} etapasVisitadas={['boas_vindas', 'raca', 'classe']} puladas={['raca']} onEtapaClick={() => {}} isLight={true} />,
    );
    expect(html).toContain('Raça (pulada)');
  });

  it('barra de progresso reflete a posição', () => {
    const html = renderToStaticMarkup(
      <Stepper etapas={etapas} etapaIndex={2} etapasConcluidas={[]} etapasVisitadas={[]} onEtapaClick={() => {}} isLight={false} />,
    );
    expect(html).toContain('width:100%');
  });

  it('etapa invalidada ganha alerta âmbar e motivo acessível', () => {
    const html = renderToStaticMarkup(
      <Stepper etapas={etapas} etapaIndex={2} etapasConcluidas={['boas_vindas', 'raca']} etapasVisitadas={['boas_vindas', 'raca', 'classe']} invalidadas={['raca']} onEtapaClick={() => {}} isLight={false} />,
    );
    expect(html).toMatch(/data-etapa="raca"[^>]*data-invalidada="true"/);
    expect(html).toContain('precisa ser refeita');
    expect(html).not.toMatch(/data-etapa="boas_vindas"[^>]*data-invalidada="true"/);
  });
});
