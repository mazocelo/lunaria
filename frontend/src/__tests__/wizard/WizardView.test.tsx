// src/__tests__/wizard/WizardView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import WizardView from '../../Pages/Personagem/Wizard/wizard.view';
import WizardFooter from '../../Pages/Personagem/Wizard/components/WizardFooter';
import { criarPropsDaView } from './wizardViewFixture';
import { montar, clicar, digitar, tecla } from '../helpers/montar';
import type { WizardMessage } from '../../Pages/Personagem/Wizard/hooks/useChatState';

const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>);

describe('WizardFooter', () => {
  const base = { etapaIndex: 2, etapasTotal: 5, podeContinuar: true, enviando: false, onVoltar: () => {}, isLight: false };

  it('sem onContinuar mostra só Voltar', () => {
    const html = render(<WizardFooter {...base} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).not.toContain('data-acao="continuar"');
  });

  it('com onContinuar mostra Voltar e Continuar', () => {
    const html = render(<WizardFooter {...base} onContinuar={() => {}} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).toContain('data-acao="continuar"');
  });
});

describe('WizardView: rodapé (A01)', () => {
  it('background (antes no chat) tem Voltar e Continuar com motivo', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'background', etapaIndex: 3 })} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
    expect(html).toContain('Escreva ou escolha um background');
  });

  it('tela nova segue com Voltar e Continuar', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'raca', etapaIndex: 1 })} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).toContain('data-acao="continuar"');
  });
});

describe('WizardView: sair do wizard (A03)', () => {
  it('cabeçalho tem Sair avisando que o rascunho fica salvo', () => {
    const html = render(<WizardView {...criarPropsDaView()} />);
    expect(html).toMatch(/data-acao="sair"[^>]*title="[^"]*Seu rascunho fica salvo/);
  });

  it('Sair navega para /personagens', () => {
    const navigate = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ navigate })} /></ThemeProvider>);
    clicar(container.querySelector('[data-acao="sair"]'));
    expect(navigate).toHaveBeenCalledWith('/personagens');
    desmontar();
  });
});

describe('WizardView: etapa Nome (A11)', () => {
  const continuar = (c: HTMLElement) => c.querySelector('[data-acao="continuar"]');

  it('sem nome e sem rascunho o Continuar fica desabilitado', () => {
    const html = render(<WizardView {...criarPropsDaView()} />);
    expect(html).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
  });

  it('digitar o nome habilita o Continuar, que grava o rascunho e avança', () => {
    const definirNome = vi.fn();
    const avancarComMestre = vi.fn();
    const enviarMensagem = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ definirNome, avancarComMestre, enviarMensagem })} /></ThemeProvider>);
    digitar(container.querySelector('#nome-heroi'), '  Kaelen ');
    expect(continuar(container)?.hasAttribute('disabled')).toBe(false);
    clicar(continuar(container));
    expect(definirNome).toHaveBeenCalledWith('Kaelen');
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Kaelen' });
    expect(enviarMensagem).not.toHaveBeenCalled();
    desmontar();
  });

  it('nome já salvo e editado: Continuar usa a edição, não o nome antigo', () => {
    const definirNome = vi.fn();
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ nome: 'Runa', definirNome, avancarComMestre })} /></ThemeProvider>);
    digitar(container.querySelector('#nome-heroi'), 'Runa Vel');
    clicar(continuar(container));
    expect(definirNome).toHaveBeenCalledWith('Runa Vel');
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Runa Vel' });
    desmontar();
  });

  it('Enter no input segue o mesmo caminho do Continuar', () => {
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ nome: 'Runa', definirNome: vi.fn(), avancarComMestre })} /></ThemeProvider>);
    const form = container.querySelector('#nome-heroi')?.closest('form');
    act(() => { form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Runa' });
    desmontar();
  });
});

describe('WizardView: feedback do Mestre nas telas novas (A06/A07/A10)', () => {
  const racas = [{ id: 1, nome: 'Elfo' }, { id: 2, nome: 'Anão' }];
  const naRaca = { etapaAtual: 'raca', etapaIndex: 1, racasDisponiveis: racas, racaId: 1 };
  const mestre = (content: string, etapa: string): WizardMessage => ({ role: 'mestre', content, etapa });

  it('enviando mostra "O Mestre está pensando…" acima do rodapé', () => {
    const html = render(<WizardView {...criarPropsDaView({ ...naRaca, enviando: true })} />);
    const pensando = html.indexOf('O Mestre está pensando…');
    expect(pensando).toBeGreaterThan(-1);
    expect(pensando).toBeLessThan(html.indexOf('data-acao="voltar"'));
  });

  it('Continuar recusado: card com a fala do Mestre e Abrir conversa; some ao mudar de etapa', () => {
    const avancarComMestre = vi.fn();
    const inicial = [mestre('Escolha sua raça.', 'raca')];
    const ui = (over: Parameters<typeof criarPropsDaView>[0]) => <ThemeProvider><WizardView {...criarPropsDaView({ ...naRaca, avancarComMestre, mensagens: inicial, ...over })} /></ThemeProvider>;
    const { container, rerender, desmontar } = montar(ui({}));
    clicar(container.querySelector('[data-acao="continuar"]'));
    expect(avancarComMestre).toHaveBeenCalled();
    rerender(ui({ enviando: true }));
    expect(container.querySelector('[data-mestre="recusa"]')).toBeNull();

    const recusa = [...inicial, mestre('Antes, pense no **orçamento**.', 'raca')];
    rerender(ui({ mensagens: recusa }));
    const card = container.querySelector('[data-mestre="recusa"]');
    expect(card?.getAttribute('role')).toBe('status');
    expect(card?.getAttribute('aria-live')).toBe('polite');
    expect(card?.textContent).toContain('orçamento');
    expect(card?.textContent).toContain('Abrir conversa');

    rerender(ui({ mensagens: recusa, etapaAtual: 'classe', etapaIndex: 2 }));
    expect(container.querySelector('[data-mestre="recusa"]')).toBeNull();
    rerender(ui({ mensagens: recusa }));
    expect(container.querySelector('[data-mestre="recusa"]')).toBeNull();
    desmontar();
  });

  it('escolher carta só seleciona: não chama o Mestre (A16)', () => {
    const selecionarSugestao = vi.fn();
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ ...naRaca, racaId: null, selecionarSugestao, avancarComMestre })} /></ThemeProvider>);
    clicar(container.querySelector('[data-item="2"] > *'));
    expect(selecionarSugestao).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'raca', id: 2 }));
    expect(avancarComMestre).not.toHaveBeenCalled();
    desmontar();
  });

  it('falha do Mestre (mensagem de sistema marcada) vira aviso âmbar na etapa', () => {
    const msgs: WizardMessage[] = [{ role: 'sistema', content: 'Nao foi possivel contatar o Mestre Criador.', etapa: 'raca', falha: true }];
    const html = render(<WizardView {...criarPropsDaView({ ...naRaca, mensagens: msgs })} />);
    expect(html).toContain('data-mestre="falha"');
    expect(html).toContain('O Mestre não respondeu');
  });

  it('mensagem de sistema comum não vira aviso', () => {
    const msgs: WizardMessage[] = [{ role: 'sistema', content: '**Rascunho restaurado.**', etapa: 'raca' }];
    const html = render(<WizardView {...criarPropsDaView({ ...naRaca, mensagens: msgs })} />);
    expect(html).not.toContain('data-mestre="falha"');
  });
});

describe('WizardView: estados do catálogo (A04)', () => {
  it('raças carregando mostram esqueletos', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'raca', etapaIndex: 1, catalogoCarregando: { raca: true, classe: false } })} />);
    expect(html).toContain('data-estado="carregando"');
  });

  it('erro nas classes: mensagem própria e Tentar de novo recarrega as classes', () => {
    const recarregarCatalogo = vi.fn();
    const props = criarPropsDaView({ etapaAtual: 'classe', etapaIndex: 2, catalogoErro: { raca: null, classe: 'Network Error' }, recarregarCatalogo });
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...props} /></ThemeProvider>);
    expect(container.textContent).toContain('Não conseguimos carregar as classes');
    clicar(container.querySelector('[data-acao="tentar-de-novo"]'));
    expect(recarregarCatalogo).toHaveBeenCalledWith('classe');
    desmontar();
  });

  it('nenhuma raça cadastrada', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'raca', etapaIndex: 1 })} />);
    expect(html).toContain('Nenhuma raça cadastrada para este sistema');
  });
});

describe('WizardView: painel do Mestre (M1)', () => {
  it('abre pelo cabeçalho, fecha com Esc e devolve o foco ao botão', () => {
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView()} /></ThemeProvider>);
    const botao = container.querySelector<HTMLButtonElement>('[data-acao="abrir-mestre"]');
    act(() => { botao?.focus(); });
    clicar(botao);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement?.id).toBe('mestre-input');
    tecla(document, 'Escape');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(botao);
    desmontar();
  });
});

const etapasCompletas = [
  { id: 'boas_vindas', label: 'Nome' }, { id: 'raca', label: 'Raça' }, { id: 'classe', label: 'Classe' },
  { id: 'background', label: 'Background' }, { id: 'desvantagens', label: 'Desvantagens' }, { id: 'vantagens', label: 'Vantagens' },
  { id: 'atributos', label: 'Atributos' }, { id: 'equipamentos', label: 'Equipamentos' }, { id: 'resumo', label: 'Finalizar' },
];
const naEtapa = (id: string) => ({ etapas: etapasCompletas, etapaAtual: id, etapaIndex: etapasCompletas.findIndex((e) => e.id === id) });
const ui = (over: Parameters<typeof criarPropsDaView>[0]) => <ThemeProvider><WizardView {...criarPropsDaView(over)} /></ThemeProvider>;

describe('WizardView: troca que derruba trabalho pede confirmação (A20)', () => {
  const racas = [{ id: 1, nome: 'Elfo', custo: 0 }, { id: 2, nome: 'Anão', custo: 3 }];

  it('trocar a raça com atributos confirmados lista as etapas e só troca ao confirmar', () => {
    const selecionarSugestao = vi.fn();
    const { container, desmontar } = montar(ui({ ...naEtapa('raca'), racasDisponiveis: racas, racaId: 1, etapasConcluidas: ['boas_vindas', 'raca'], bonusAplicados: true, selecionarSugestao }));
    clicar(container.querySelector('[data-item="2"] > *'));
    const dialogo = document.querySelector('[role="alertdialog"]');
    expect(dialogo?.textContent).toContain('Trocar a raça?');
    expect(dialogo?.textContent).toContain('Atributos');
    expect(selecionarSugestao).not.toHaveBeenCalled();
    clicar(document.querySelector('[role="alertdialog"] [data-acao="confirmar"]'));
    expect(selecionarSugestao).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'raca', id: 2 }));
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    desmontar();
  });

  it('carta que deixaria o saldo negativo mostra o aviso e pede confirmação', () => {
    const selecionarSugestao = vi.fn();
    const { container, desmontar } = montar(ui({ ...naEtapa('raca'), racasDisponiveis: racas, racaId: null, pontosCriacaoRestantes: 1, selecionarSugestao }));
    expect(container.querySelector('[data-item="2"]')?.textContent).toContain('Seu saldo ficaria -2');
    clicar(container.querySelector('[data-item="2"] > *'));
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('-2');
    clicar(document.querySelector('[role="alertdialog"] [data-acao="cancelar"]'));
    expect(selecionarSugestao).not.toHaveBeenCalled();
    desmontar();
  });
});

describe('WizardView: telas novas no lugar do chat', () => {
  it('Background grava o texto e o Continuar chama o Mestre', () => {
    const definirBackground = vi.fn();
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(ui({ ...naEtapa('background'), background: 'Órfão do porto', definirBackground, avancarComMestre }));
    digitar(container.querySelector('#background-heroi'), 'Filha de ferreiro');
    expect(definirBackground).toHaveBeenCalledWith('Filha de ferreiro');
    expect(avancarComMestre).not.toHaveBeenCalled();
    clicar(container.querySelector('[data-acao="continuar"]'));
    expect(avancarComMestre).toHaveBeenCalled();
    desmontar();
  });

  it('Vantagens: orçamento, carta bloqueada com motivo, remoção pelo chip e Pular no rodapé', () => {
    const removerSelecao = vi.fn();
    const pularEtapa = vi.fn();
    const vantagensDisponiveis = [{ id: 7, nome: 'Riqueza', custo: 4 }, { id: 8, nome: 'Sorte', custo: 1 }, { id: 9, nome: 'Fobia', custo: -1 }];
    const { container, desmontar } = montar(ui({ ...naEtapa('vantagens'), vantagensDisponiveis, vantagensIds: [8], pontosCriacaoRestantes: 2, removerSelecao, pularEtapa }));
    expect(container.textContent).toContain('Pontos de criação');
    expect(container.querySelector('[data-item="7"]')?.getAttribute('data-bloqueada')).toBe('true');
    expect(container.querySelector('[data-item="7"]')?.textContent).toContain('Saldo insuficiente');
    expect(container.querySelector('[data-item="9"]')).toBeNull();
    clicar(container.querySelector('[data-remover="8"]'));
    expect(removerSelecao).toHaveBeenCalledWith('vantagem', 8);
    clicar(container.querySelector('[data-acao="pular"]'));
    expect(pularEtapa).toHaveBeenCalledWith('vantagens');
    desmontar();
  });

  it('Atributos: um clique confirma, espera o bônus aplicar e só então avança (decisão do dono)', () => {
    const confirmarAtributos = vi.fn();
    const avancarComMestre = vi.fn();
    const base = { ...naEtapa('atributos'), pontosRestantes: 0, pontosTotais: 10, confirmarAtributos, avancarComMestre };
    const { container, rerender, desmontar } = montar(ui({ ...base, bonusAplicados: false }));
    expect(container.querySelector('[data-acao="confirmar-atributos"]')).toBeNull();
    clicar(container.querySelector('[data-acao="continuar"]'));
    expect(confirmarAtributos).toHaveBeenCalledTimes(1);
    expect(avancarComMestre).not.toHaveBeenCalled();
    rerender(ui({ ...base, bonusAplicados: true }));
    expect(avancarComMestre).toHaveBeenCalledTimes(1);
    rerender(ui({ ...base, bonusAplicados: true, mensagens: [{ role: 'mestre', content: 'ok', etapa: 'atributos' }] }));
    expect(avancarComMestre).toHaveBeenCalledTimes(1);
    desmontar();
  });

  it('Atributos com pontos sobrando: motivo no rodapé', () => {
    const html = render(<WizardView {...criarPropsDaView({ ...naEtapa('atributos'), pontosRestantes: 3 })} />);
    expect(html).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
    expect(html).toContain('Distribua mais 3 pts');
  });

  it('Finalizar: Criar {nome} único no rodapé, bloqueado com motivo enquanto houver pendência', () => {
    const html = render(<WizardView {...criarPropsDaView({ ...naEtapa('resumo'), nome: 'Ayla' })} />);
    expect(html).toContain('Antes de criar');
    expect(html).toMatch(/data-acao="continuar"[^>]*\sdisabled=""[^>]*>(?:(?!<\/button>)[\s\S])*Criar Ayla/);
    expect(html.match(/Criar Ayla/g)?.length).toBe(1);
  });

  it('Finalizar sem pendências cria pelo rodapé', () => {
    const salvarPersonagem = vi.fn();
    const pronto = { nome: 'Ayla', racaId: 1, classeId: 2, background: 'x', skipVantagens: true, skipDesvantagens: true, bonusAplicados: true, comboPreviewData: { ok: true } };
    const { container, desmontar } = montar(ui({ ...naEtapa('resumo'), ...pronto, salvarPersonagem }));
    clicar(container.querySelector('[data-acao="continuar"]'));
    expect(salvarPersonagem).toHaveBeenCalledTimes(1);
    desmontar();
  });
});

describe('WizardView: banners e anúncios (A19, A31, MA:G4, MA:G6)', () => {
  it('erro com role=alert', () => {
    const html = render(<WizardView {...criarPropsDaView({ error: 'O Mestre não respondeu.' })} />);
    expect(html).toMatch(/role="alert"[^>]*>(?:(?!<\/div>)[\s\S])*O Mestre não respondeu\./);
  });

  it('etapas a refazer: banner nomeia as etapas, leva à primeira e o Stepper marca', () => {
    const navegarParaEtapa = vi.fn();
    const limparInvalidadas = vi.fn();
    const { container, desmontar } = montar(ui({ ...naEtapa('classe'), etapasInvalidadas: ['atributos', 'equipamentos'], navegarParaEtapa, limparInvalidadas }));
    const banner = container.querySelector('[data-banner="invalidadas"]');
    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.textContent).toContain('Atributos e Equipamentos precisam ser refeitas');
    clicar(banner?.querySelector('[data-acao="ir-invalidada"]') ?? null);
    expect(navegarParaEtapa).toHaveBeenCalledWith('atributos');
    clicar(banner?.querySelector('[data-acao="entendi"]') ?? null);
    expect(limparInvalidadas).toHaveBeenCalled();
    expect(container.querySelector('[data-etapa="atributos"]')?.getAttribute('data-invalidada')).toBe('true');
    desmontar();
  });

  it('rascunho restaurado: Continuar dispensa; Começar do zero confirma antes de apagar', () => {
    const setDraftRestaurado = vi.fn();
    const resetarTudo = vi.fn();
    const { container, desmontar } = montar(ui({ ...naEtapa('classe'), nome: 'Ayla', draftRestaurado: true, setDraftRestaurado, resetarTudo }));
    const banner = container.querySelector('[data-banner="rascunho"]');
    expect(banner?.textContent).toContain('Restauramos Ayla na etapa Classe');
    clicar(banner?.querySelector('[data-acao="manter-rascunho"]') ?? null);
    expect(setDraftRestaurado).toHaveBeenCalledWith(false);
    clicar(banner?.querySelector('[data-acao="comecar-do-zero"]') ?? null);
    expect(resetarTudo).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('Começar do zero?');
    clicar(document.querySelector('[role="alertdialog"] [data-acao="confirmar"]'));
    expect(resetarTudo).toHaveBeenCalledTimes(1);
    desmontar();
  });

  it('trocar de etapa leva o foco ao título (não na primeira montagem)', () => {
    const { rerender, desmontar } = montar(ui({ ...naEtapa('raca') }));
    expect(document.activeElement?.id).not.toBe('etapa-titulo');
    rerender(ui({ ...naEtapa('classe') }));
    expect(document.activeElement?.id).toBe('etapa-titulo');
    desmontar();
  });

  it('overlay de criação anuncia o progresso', () => {
    const html = render(<WizardView {...criarPropsDaView({ creationFlowStatus: 'creating_character' })} />);
    expect(html).toMatch(/role="status"[^>]*aria-live="polite"[^>]*aria-busy="true"/);
  });
});
