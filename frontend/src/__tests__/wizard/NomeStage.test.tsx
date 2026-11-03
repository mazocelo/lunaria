// src/__tests__/wizard/NomeStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NomeStage from '../../Pages/Personagem/Wizard/stages/NomeStage';
import { montar, clicar, digitar } from '../helpers/montar';

const base = {
  enviando: false, onRascunhoChange: () => {}, onConfirmar: () => {}, onPedirSugestoes: () => {},
  nomeSistema: 'Lunaria RPG', isLight: false,
};

describe('NomeStage', () => {
  it('input mostra o rascunho e não há botão próprio de confirmar (o Continuar do rodapé confirma)', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} rascunho="Kaelen" sugestoes={[]} />);
    expect(html).toMatch(/<input[^>]*id="nome-heroi"[^>]*value="Kaelen"/);
    expect(html).not.toContain('confirmar-nome');
    expect(html).not.toContain('Usar este nome');
    expect(html).toContain('Pedir nomes ao Mestre');
  });

  it('com sugestões mostra os chips', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} rascunho="" sugestoes={['Runa', 'Jamal']} />);
    expect(html).toContain('>Runa<');
    expect(html).toContain('>Jamal<');
  });

  it('texto de ajuda usa o nome do sistema, não "Lunaria" fixo', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} nomeSistema="D&D 5e" rascunho="" sugestoes={[]} />);
    expect(html).toContain('D&amp;D 5e');
    expect(html).not.toContain('Lunaria');
  });

  it('chip sugerido só preenche o input, não confirma', () => {
    const onRascunhoChange = vi.fn();
    const onConfirmar = vi.fn();
    const { container, desmontar } = montar(<NomeStage {...base} rascunho="" sugestoes={['Runa']} onRascunhoChange={onRascunhoChange} onConfirmar={onConfirmar} />);
    clicar([...container.querySelectorAll('button')].find((b) => b.textContent === 'Runa') ?? null);
    expect(onRascunhoChange).toHaveBeenCalledWith('Runa');
    expect(onConfirmar).not.toHaveBeenCalled();
    desmontar();
  });

  it('digitar repassa o valor para quem controla o rascunho', () => {
    const onRascunhoChange = vi.fn();
    const { container, desmontar } = montar(<NomeStage {...base} rascunho="" sugestoes={[]} onRascunhoChange={onRascunhoChange} />);
    digitar(container.querySelector('#nome-heroi'), 'Kae');
    expect(onRascunhoChange).toHaveBeenCalledWith('Kae');
    desmontar();
  });
});
