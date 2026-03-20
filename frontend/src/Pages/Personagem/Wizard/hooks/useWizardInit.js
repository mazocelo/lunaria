
import { useEffect, useRef, useCallback } from 'react';
import { mestreCriadorService } from '../../../../services/index.js';

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
}) => {
  const {
    setMensagens, setEnviando, enviandoRef,
    setSugestoes, setError,
  } = chat;

  const wizardInitRef = useRef(false);

  // ---- iniciarWizard ----
  const iniciarWizard = useCallback(async () => {
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'boas_vindas',
        estado: {},
        mensagemJogador: 'Olá, estou pronto para criar meu personagem!',
        historico: [],
        actionMode: 'enter_stage',
      });
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa: 'boas_vindas',
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);
      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
    } catch (err) {
      setError(err.message);
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: '**Bem-vindo, aventureiro!** Você chega a uma taverna antiga onde pergaminhos e mapas cobrem as paredes. Um sábio ancião sorri ao vê-lo.\n\n*"Ah, mais um herói em busca de destino! Diga-me, como deseja ser chamado neste mundo?"*',
        etapa: 'boas_vindas',
        sugestoes: [],
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, []);

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
      });

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
    } catch (err) {
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Nao foi possivel reabrir a fala do Mestre para esta etapa. Voce ainda pode seguir normalmente pelo painel da etapa.',
        etapa,
        timestamp: new Date(),
      }]);
      setSugestoes([]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [navigation.etapaAtual, getEstado, bonusCalc.setAtributosSugeridos]);

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
    const handler = (e) => {
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
