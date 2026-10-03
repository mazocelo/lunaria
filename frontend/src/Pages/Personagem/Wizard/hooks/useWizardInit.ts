import { useEffect, useRef, useCallback } from 'react';
import { mestreCriadorService } from '../../../../services/index';
import type { ChatStateApi } from './useChatState';
import type { BonusCalculationApi } from './useBonusCalculation';
import type { ComboPreviewApi } from './useComboPreview';
import type { WizardDraft } from './useDraftPersistence';

const SISTEMA_LABELS: Record<string, string> = { lunaria: 'Lunaria RPG', tresdet: '3D&T Alpha', dnd5e: 'D&D 5e' };

interface NavigationApi {
  etapaAtual: string;
  resetarNavegacao: () => void;
  [key: string]: unknown;
}

interface PointSystemApi {
  resetarSelecoes: () => void;
  [key: string]: unknown;
}

interface CreationApi {
  setCreationFlowStatus: (status: string) => void;
  setCreationResultModalOpen: (open: boolean) => void;
  setCreationResultData: (data: unknown) => void;
  [key: string]: unknown;
}

interface MestreResposta {
  mensagem?: string;
  sugestoes?: Array<Record<string, unknown>>;
  atributos_sugeridos?: unknown;
  [key: string]: unknown;
}

interface UseWizardInitParams {
  chat: ChatStateApi;
  navigation: NavigationApi;
  nome: string;
  racaId: number | string | null;
  setNome: (v: string) => void;
  setRacaId: (v: number | string | null) => void;
  setRacaNome: (v: string) => void;
  setClasseId: (v: number | string | null) => void;
  setClasseNome: (v: string) => void;
  setBackground: (v: string) => void;
  pointSystem: PointSystemApi;
  bonusCalc: BonusCalculationApi;
  creation: CreationApi;
  draftInicial: WizardDraft | null;
  limparDraft: () => void;
  setDraftRestaurado: (v: boolean) => void;
  getEstado: () => Record<string, unknown>;
  comboPreview: ComboPreviewApi;
  sistema?: string;
}

/**
 * Handles wizard initialization (first-time start or draft restoration),
 * the `beforeunload` warning, and draft discard / full reset.
 */
export const useWizardInit = ({
  // Chat state
  chat,
  // Navigation
  navigation,
  // Character state (read)
  nome, racaId,
  // Character state setters
  setNome, setRacaId, setRacaNome, setClasseId, setClasseNome, setBackground,
  // Point system
  pointSystem,
  // Bonus calc
  bonusCalc,
  // Creation state reset
  creation,
  // Draft
  draftInicial, limparDraft, setDraftRestaurado,
  // Estado helpers
  getEstado,
  // Combo preview
  comboPreview,
  // Sistema
  sistema,
}: UseWizardInitParams) => {
  const {
    setMensagens, setEnviando, enviandoRef,
    setSugestoes, setError,
  } = chat;

  const wizardInitRef = useRef(false);

  // ---- iniciarWizard ----
  const iniciarWizard = useCallback(async () => {
    const sistemaEfetivo = sistema || 'lunaria';
    const label = SISTEMA_LABELS[sistemaEfetivo] || sistemaEfetivo;

    const mensagemSistema = {
      id: Date.now(),
      role: 'sistema',
      content: `**Criando ficha: ${label}**`,
      etapa: 'boas_vindas',
      timestamp: new Date(),
    };

    setMensagens([mensagemSistema]);
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'boas_vindas',
        estado: {},
        mensagemJogador: 'Olá, estou pronto para criar meu personagem!',
        historico: [],
        actionMode: 'enter_stage',
        sistema: sistemaEfetivo,
      }) as MestreResposta;
      setMensagens([mensagemSistema, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        etapa: 'boas_vindas',
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);
      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setMensagens([mensagemSistema, {
        id: Date.now() + 1,
        role: 'mestre',
        content: '**Bem-vindo, aventureiro!** Você chega a uma taverna antiga onde pergaminhos e mapas cobrem as paredes. Um sábio ancião sorri ao vê-lo.\n\n*"Ah, mais um herói em busca de destino! Diga-me, como deseja ser chamado neste mundo?"*',
        etapa: 'boas_vindas',
        sugestoes: [],
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, [sistema]);

  // ---- rehidratarEtapaAtual ----
  const rehidratarEtapaAtual = useCallback(async () => {
    const etapa = navigation.etapaAtual;
    if (!etapa || etapa === 'boas_vindas' || enviandoRef.current) return;

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa,
        estado: getEstado(),
        mensagemJogador: '',
        historico: [],
        actionMode: 'enter_stage',
        sistema: sistema || 'lunaria',
      }) as MestreResposta;

      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) {
        bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);
      }
    } catch (_err) {
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Nao foi possivel reabrir a fala do Mestre para esta etapa. Voce ainda pode seguir normalmente pelo painel da etapa.',
        etapa,
        falha: true,
        timestamp: new Date(),
      }]);
      setSugestoes([]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [navigation.etapaAtual, getEstado, bonusCalc.setAtributosSugeridos, sistema]);

  // ---- Main initialization effect ----
  useEffect(() => {
    if (wizardInitRef.current) return;
    wizardInitRef.current = true;

    if (draftInicial) {
      setDraftRestaurado(true);
      setMensagens([{
        id: Date.now(),
        role: 'sistema',
        content: '**Rascunho restaurado.** Seu progresso anterior foi recuperado. Voce pode continuar de onde parou ou descartar o rascunho para recomecar.',
        etapa: draftInicial.etapaAtual || 'boas_vindas',
        timestamp: new Date(),
      }]);
      if (draftInicial.etapaAtual && draftInicial.etapaAtual !== 'boas_vindas') {
        rehidratarEtapaAtual();
      }
      return;
    }

    iniciarWizard();
  }, [draftInicial, iniciarWizard, rehidratarEtapaAtual]);

  // ---- beforeunload warning ----
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (nome || racaId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [nome, racaId]);

  // ---- descartarDraft ----
  const descartarDraft = useCallback(() => {
    limparDraft();
    navigation.resetarNavegacao();
    setNome('');
    setRacaId(null);
    setRacaNome('');
    setClasseId(null);
    setClasseNome('');
    setBackground('');
    pointSystem.resetarSelecoes();
    bonusCalc.resetarAtributos();
    setSugestoes([]);
    setDraftRestaurado(false);
    setMensagens([]);
    setError(null);
    comboPreview.resetComboPreview();
    creation.setCreationFlowStatus('idle');
    creation.setCreationResultModalOpen(false);
    creation.setCreationResultData(null);
    iniciarWizard();
  }, [iniciarWizard, limparDraft, navigation.resetarNavegacao,
      pointSystem.resetarSelecoes, bonusCalc.resetarAtributos,
      comboPreview.resetComboPreview]);

  return {
    iniciarWizard,
    rehidratarEtapaAtual,
    descartarDraft,
  };
};
