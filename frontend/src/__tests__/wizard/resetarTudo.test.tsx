// src/__tests__/wizard/resetarTudo.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { montar } from '../helpers/montar';
import { useWizardInit } from '../../Pages/Personagem/Wizard/hooks/useWizardInit';
import { useDraftPersistence, chaveDoRascunho } from '../../Pages/Personagem/Wizard/hooks/useDraftPersistence';

vi.mock('../../services/index', () => ({
  mestreCriadorService: { interagir: vi.fn(() => Promise.resolve({ mensagem: 'Bem-vindo', sugestoes: [] })) },
}));

type Params = Parameters<typeof useWizardInit>[0];

function paramsFalsos() {
  const fn = () => vi.fn();
  return {
    chat: { setMensagens: fn(), setEnviando: fn(), enviandoRef: { current: false }, setSugestoes: fn(), setError: fn() },
    navigation: { etapaAtual: 'boas_vindas', resetarNavegacao: fn() },
    nome: '', racaId: null,
    setNome: fn(), setRacaId: fn(), setRacaNome: fn(), setClasseId: fn(), setClasseNome: fn(), setBackground: fn(),
    pointSystem: { resetarSelecoes: fn() },
    bonusCalc: { resetarAtributos: fn(), setAtributosSugeridos: fn() },
    creation: { setCreationFlowStatus: fn(), setCreationResultModalOpen: fn(), setCreationResultData: fn() },
    draftInicial: null, limparDraft: fn(), setDraftRestaurado: fn(), getEstado: () => ({}),
    comboPreview: { resetComboPreview: fn() },
    resetarDnd: fn(), resetGrimorio: fn(), resetImage: fn(),
    sistema: 'dnd5e',
  };
}

describe('resetarTudo ("Começar do zero")', () => {
  it('zera rascunho, escolhas, D&D, grimório e retrato', async () => {
    const p = paramsFalsos();
    let api: ReturnType<typeof useWizardInit> | null = null;
    const Sonda = () => { api = useWizardInit(p as unknown as Params); return null; };
    const m = montar(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { api!.resetarTudo(); await Promise.resolve(); });
    for (const f of [p.limparDraft, p.navigation.resetarNavegacao, p.pointSystem.resetarSelecoes, p.bonusCalc.resetarAtributos,
      p.comboPreview.resetComboPreview, p.resetarDnd, p.resetGrimorio, p.resetImage]) {
      expect(f).toHaveBeenCalledTimes(1);
    }
    expect(p.setRacaId).toHaveBeenCalledWith(null);
    expect(api!.descartarDraft).toBe(api!.resetarTudo);
    m.desmontar();
  });
});

describe('useDraftPersistence', () => {
  beforeEach(() => localStorage.clear());

  it('lê só o rascunho do próprio sistema e limpa só a chave dele', () => {
    localStorage.setItem(chaveDoRascunho('lunaria'), JSON.stringify({ sistema: 'lunaria', versao: 3, nome: 'Ayla', etapaAtual: 'raca' }));
    let api: ReturnType<typeof useDraftPersistence> | null = null;
    const Sonda = ({ sistema }: { sistema: string }) => { api = useDraftPersistence(sistema); return null; };
    const m = montar(<Sonda sistema="dnd5e" />);
    expect(api!.draftInicial).toBeNull();
    act(() => { api!.salvarDraft({ etapaAtual: 'skills', nome: 'Bram', dndSkillsConfirmed: true }); });
    expect(JSON.parse(localStorage.getItem(chaveDoRascunho('dnd5e'))!)).toMatchObject({ sistema: 'dnd5e', nome: 'Bram', dndSkillsConfirmed: true });
    act(() => { api!.limparDraft(); });
    expect(localStorage.getItem(chaveDoRascunho('dnd5e'))).toBeNull();
    expect(localStorage.getItem(chaveDoRascunho('lunaria'))).not.toBeNull();
    m.desmontar();
  });
});
