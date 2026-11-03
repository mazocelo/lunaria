// src/__tests__/wizard/BackgroundStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BackgroundStage from '../../Pages/Personagem/Wizard/stages/BackgroundStage';
import { montar, clicar, digitar } from '../helpers/montar';

const base = { valor: '', sugestoes: [], enviando: false, onMudar: () => {}, onPedirIdeias: () => {}, isLight: false };

describe('BackgroundStage', () => {
  it('textarea rotulada com contador', () => {
    const html = renderToStaticMarkup(<BackgroundStage {...base} valor="Filha de contrabandistas." />);
    expect(html).toMatch(/<label[^>]*for="background-heroi"/);
    expect(html).toContain('Filha de contrabandistas.');
    expect(html).toContain('25/2000');
    expect(html).toContain('Pedir ideias ao Mestre');
  });
  it('sugestões preenchem; a igual ao texto aparece escolhida', () => {
    const sugestoes = [{ nome: 'Órfã do porto', descricao: 'Cresceu entre redes.' }, { nome: 'Exilado da corte', descricao: null }];
    const html = renderToStaticMarkup(<BackgroundStage {...base} valor="Órfã do porto" sugestoes={sugestoes} />);
    expect((html.match(/data-sugestao-bg=/g) ?? []).length).toBe(2);
    expect(html).toMatch(/data-sugestao-bg="0"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-sugestao-bg="1"[^>]*aria-pressed="false"/);
    expect(html).toContain('Cresceu entre redes.');
  });
  it('enviando desabilita pedir ideias', () => {
    expect(renderToStaticMarkup(<BackgroundStage {...base} enviando />)).toMatch(/data-acao="pedir-ideias"[^>]*\sdisabled=""/);
  });
  it('digitar e clicar numa sugestão chamam onMudar; pedir ideias chama onPedirIdeias', () => {
    const onMudar = vi.fn();
    const onPedirIdeias = vi.fn();
    const sugestoes = [{ nome: 'Órfã do porto', descricao: null }];
    const { container, desmontar } = montar(<BackgroundStage {...base} sugestoes={sugestoes} onMudar={onMudar} onPedirIdeias={onPedirIdeias} />);
    digitar(container.querySelector('#background-heroi'), 'Neto de ferreiro');
    expect(onMudar).toHaveBeenLastCalledWith('Neto de ferreiro');
    clicar(container.querySelector('[data-sugestao-bg="0"]'));
    expect(onMudar).toHaveBeenLastCalledWith('Órfã do porto');
    clicar(container.querySelector('[data-acao="pedir-ideias"]'));
    expect(onPedirIdeias).toHaveBeenCalledTimes(1);
    desmontar();
  });
});
