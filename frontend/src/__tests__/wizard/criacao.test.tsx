// src/__tests__/wizard/criacao.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { montar } from '../helpers/montar';
import { useCharacterCreation } from '../../Pages/Personagem/Wizard/hooks/useCharacterCreation';
import { passoNaoBloqueante, recarregarSemBloquear, type FalhaPosCriacao } from '../../Pages/Personagem/Wizard/stages/criacao';

const svc = vi.hoisted(() => ({
  create: vi.fn(), createDnd5e: vi.fn(), gerarBackground: vi.fn(), update: vi.fn(), post: vi.fn(),
}));
vi.mock('../../services/index', () => ({
  personagemService: { create: svc.create, createDnd5e: svc.createDnd5e, gerarBackground: svc.gerarBackground, update: svc.update },
  apiClient: { post: svc.post },
}));

describe('pós-criação', () => {
  it('registra a falha e segue', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const falhas: FalhaPosCriacao[] = [];
    expect(await passoNaoBloqueante(falhas, 'magias', () => Promise.reject(new Error('500')))).toBe(false);
    expect(await passoNaoBloqueante(falhas, 'retrato', () => Promise.resolve())).toBe(true);
    expect(falhas).toEqual(['magias']);
  });
  it('reload da lista nunca lança', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(recarregarSemBloquear(() => Promise.reject(new Error('rede')))).resolves.toBeUndefined();
  });
});

type Params = Parameters<typeof useCharacterCreation>[0];
type Api = ReturnType<typeof useCharacterCreation>;

function montarCriacao(extra: Partial<Params> = {}) {
  const setError = vi.fn();
  const params: Params = {
    getEstado: () => ({}),
    navigate: vi.fn(),
    comboPreviewData: { combo: { equipamentos: [{ id: 7 }] } },
    comboPreviewLoading: false,
    navigation: { etapaAtual: 'resumo' },
    bonusCalc: { bonusAplicados: true } as unknown as Params['bonusCalc'],
    pointSystem: { pontosCriacaoRestantes: 0 },
    estadoRef: { current: { nome: 'Lyra', racaId: 1, classeId: 2, background: 'Órfã do porto', atributosBase: { forca: 3 } } },
    setError,
    limparDraft: vi.fn(),
    recarregarPersonagens: vi.fn(() => Promise.reject(new Error('rede'))),
    imageUrl: 'https://img/x.png',
    grimorioSelecionadas: [5],
    sistema: 'lunaria',
    ...extra,
  };
  let api: Api | null = null;
  const Sonda = () => { api = useCharacterCreation(params); return null; };
  const m = montar(<Sonda />);
  return { api: () => api!, setError, m };
}

describe('useCharacterCreation (A35, A36)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    svc.create.mockReset().mockResolvedValue({ id: 42 });
    svc.createDnd5e.mockReset().mockResolvedValue({ id: 43 });
    svc.gerarBackground.mockReset().mockResolvedValue({ background_gerado: 'Gerado' });
    svc.update.mockReset().mockRejectedValue(new Error('upload'));
    svc.post.mockReset().mockRejectedValue(new Error('500'));
  });

  it('reload falho não vira erro; falhas de magias e retrato vão para o resultado', async () => {
    const { api, setError, m } = montarCriacao();
    await act(async () => { await api().salvarPersonagem(); });
    expect(svc.create).toHaveBeenCalledTimes(1);
    expect(api().creationResultModalOpen).toBe(true);
    expect(api().creationResultData?.falhas).toEqual(['retrato', 'magias']);
    expect(setError).not.toHaveBeenCalledWith(expect.stringContaining('rede'));
    m.desmontar();
  });

  it('segundo clique não cria outro: só reabre o resultado', async () => {
    const { api, m } = montarCriacao();
    await act(async () => { await api().salvarPersonagem(); });
    act(() => { api().fecharResultadoCriacao(); });
    await act(async () => { await api().salvarPersonagem(); });
    expect(svc.create).toHaveBeenCalledTimes(1);
    expect(api().creationResultModalOpen).toBe(true);
    m.desmontar();
  });

  it('background indisponível entra nas falhas (D&D)', async () => {
    svc.gerarBackground.mockRejectedValue(new Error('ia'));
    const { api, m } = montarCriacao({
      sistema: 'dnd5e', imageUrl: null,
      estadoRef: { current: { nome: 'Thorn', racaId: 1, classeId: 2, background: 'Ferreiro', dndAbilitiesConfirmed: true, dndSkillsConfirmed: true,
        dndAbilityScores: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 } } },
    });
    await act(async () => { await api().salvarPersonagem(); });
    expect(svc.createDnd5e).toHaveBeenCalledTimes(1);
    expect(api().creationResultData?.falhas).toEqual(['background']);
    m.desmontar();
  });

  it('"Começar do zero" (setCreationResultData(null)) libera nova criação', async () => {
    svc.update.mockResolvedValue({});
    const { api, m } = montarCriacao();
    await act(async () => { await api().salvarPersonagem(); });
    act(() => { api().setCreationResultData(null); });
    await act(async () => { await api().salvarPersonagem(); });
    expect(svc.create).toHaveBeenCalledTimes(2);
    m.desmontar();
  });
});
