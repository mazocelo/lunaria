import { useCallback, type MutableRefObject } from 'react';
import { mestreCriadorService } from '../../../../services/index';
import type { ChatStateApi, WizardMessage } from './useChatState';
import type { BonusCalculationApi } from './useBonusCalculation';
import { mensagemDeErro } from '../stages/mensagemDeErro';

interface DeveDefinirNomeOptions {
  aceitarNome?: boolean;
  manterEtapa?: boolean;
}

interface MestreResposta {
  mensagem?: string;
  sugestoes?: WizardSuggestion[];
  atributos_sugeridos?: unknown;
  etapa_proxima?: string;
  [key: string]: unknown;
}

interface WizardSuggestion {
  tipo?: string;
  id?: number | string;
  nome?: string;
  custo?: number | string;
  [key: string]: unknown;
}

interface NavigationApi {
  etapaAtual: string;
  registrarVisita: (etapaId: string) => boolean;
  getProximaEtapa: () => { etapa: string; primeiraVisita: boolean } | null;
  avancarEtapa: () => { etapa: string; primeiraVisita: boolean } | null;
  [key: string]: unknown;
}

interface PointSystemApi {
  vantagensIds: Array<number | string>;
  desvantagensIds: Array<number | string>;
  selecionarVantagemDesvantagem: (tipo: 'vantagem' | 'desvantagem', id: number | string, nome: string, custo: number | string) => string | null;
  removerSelecao: (tipo: 'vantagem' | 'desvantagem', id: number | string) => void;
  setSkipVantagens: (v: boolean) => void;
  setSkipDesvantagens: (v: boolean) => void;
  [key: string]: unknown;
}

/**
 * Validates whether a text input should be interpreted as the character's name.
 * Pure function — exported separately from the hook.
 */
export function deveDefinirNomeInicial(texto: string, options: DeveDefinirNomeOptions = {}): boolean {
  if (options.aceitarNome) return true;
  if (options.manterEtapa) return false;

  const valor = String(texto || '').trim();
  if (!valor) return false;
  if (valor.length > 40) return false;
  if (/[.!?]$/.test(valor)) return false;

  const normalizado = valor.toLowerCase();
  const marcadoresDePedido = [
    'sugira',
    'sugest',
    'nomes',
    'nome para',
    'personagem',
    'mostre',
    'outras op',
    'novas leituras',
    'me de',
    'me dê',
    'quero ajuda',
  ];

  if (marcadoresDePedido.some((termo) => normalizado.includes(termo))) {
    return false;
  }

  const palavras = valor.split(/\s+/).filter(Boolean);
  return palavras.length >= 1 && palavras.length <= 4;
}

/**
 * Encapsulates core mestre interaction: sending messages, advancing stages,
 * selecting suggestions, and skipping stages.
 */
interface UseMestreInteractionParams {
  setMensagens: ChatStateApi['setMensagens'];
  setEnviando: ChatStateApi['setEnviando'];
  enviandoRef: MutableRefObject<boolean>;
  setSugestoes: ChatStateApi['setSugestoes'];
  setError: ChatStateApi['setError'];
  setInputTexto: ChatStateApi['setInputTexto'];
  navigation: NavigationApi;
  nome: string;
  setNome: (v: string) => void;
  racaId: number | string | null;
  classeId: number | string | null;
  background: string;
  setBackground: (v: string) => void;
  setRacaId: (v: number | string | null) => void;
  setRacaNome: (v: string) => void;
  setClasseId: (v: number | string | null) => void;
  setClasseNome: (v: string) => void;
  pointSystem: PointSystemApi;
  bonusCalc: BonusCalculationApi;
  getEstado: () => Record<string, unknown>;
  getHistorico: () => WizardMessage[];
  estadoRef: MutableRefObject<{ nome?: string; [key: string]: unknown }>;
  sistema?: string;
}

interface EnviarMensagemOptions {
  manterEtapa?: boolean;
  aceitarNome?: boolean;
}

export const useMestreInteraction = ({
  // Chat state (from useChatState)
  setMensagens, setEnviando, enviandoRef, setSugestoes, setError,
  // Input state
  setInputTexto,
  // Navigation (from useWizardNavigation)
  navigation,
  // Character state
  nome: _nome, setNome, racaId: _racaId, classeId: _classeId, background: _background, setBackground,
  // Raca / Classe setters
  setRacaId, setRacaNome, setClasseId, setClasseNome,
  // Point system
  pointSystem,
  // Bonus calc
  bonusCalc,
  // Refs for estado/historico
  getEstado, getHistorico,
  // Estado ref
  estadoRef,
  // Sistema
  sistema,
}: UseMestreInteractionParams) => {

  /** Envia mensagem textual do jogador */
  const enviarMensagem = useCallback(async (texto: string, options: EnviarMensagemOptions = {}) => {
    if (!texto?.trim() || enviandoRef.current) return;
    const mensagemJogador = texto.trim();
    const manterEtapa = options?.manterEtapa === true;
    const estadoOverride: Record<string, unknown> = {};

    if (navigation.etapaAtual === 'boas_vindas' && (options.aceitarNome === true || !estadoRef.current.nome) && deveDefinirNomeInicial(mensagemJogador, options)) {
      setNome(mensagemJogador);
      estadoOverride.nome = mensagemJogador;
    } else if (navigation.etapaAtual === 'background' && !manterEtapa) {
      const backgroundAtualizado = mensagemJogador.slice(0, 2000);
      setBackground(backgroundAtualizado);
      estadoOverride.background = backgroundAtualizado;
    }

    setMensagens(prev => [...prev, {
      id: Date.now(),
      role: 'jogador',
      content: mensagemJogador,
      etapa: navigation.etapaAtual,
      timestamp: new Date(),
    }]);
    setInputTexto('');
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: navigation.etapaAtual,
        estado: { ...getEstado(), ...estadoOverride },
        mensagemJogador,
        historico: getHistorico(),
        actionMode: manterEtapa ? 'refresh_options' : 'reply',
        sistema: sistema || 'lunaria',
      }) as MestreResposta;

      const etapaMensagem = manterEtapa
        ? navigation.etapaAtual
        : (resultado.etapa_proxima || navigation.etapaAtual);

      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        etapa: etapaMensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);

      if (!manterEtapa && resultado.etapa_proxima && resultado.etapa_proxima !== navigation.etapaAtual) {
        navigation.registrarVisita(resultado.etapa_proxima);
      }
    } catch (err) {
      console.error('[wizard]', err);
      setError(mensagemDeErro(err));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.etapaAtual, getEstado, getHistorico, bonusCalc.setAtributosSugeridos, navigation.registrarVisita, sistema]);

  /** Aplica sugestão de atributos do Mestre */
  const aplicarSugestaoAtributos = useCallback(() => {
    const resultado = bonusCalc.aplicarAtributosSugeridos();
    if (!resultado?.applied) {
      setError(resultado?.reason || 'A sugestao de atributos do Mestre veio invalida e nao foi aplicada.');
      return resultado;
    }
    setError(null);
    return resultado;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bonusCalc.aplicarAtributosSugeridos]);

  /** Seleciona sugestão silenciosamente (T1) */
  const selecionarSugestao = useCallback((sugestao: WizardSuggestion) => {
    const { tipo, id, nome: sugestaoNome, custo } = sugestao;
    if (id == null || !sugestaoNome) return;

    switch (tipo) {
      case 'raca':
        setRacaId(id);
        setRacaNome(sugestaoNome);
        break;
      case 'classe':
        setClasseId(id);
        setClasseNome(sugestaoNome);
        break;
      case 'vantagem': {
        const erro = pointSystem.selecionarVantagemDesvantagem(tipo, id, sugestaoNome, custo ?? 0);
        if (erro) { setError(erro); return; }
        // P2: reset skip ao selecionar manualmente
        pointSystem.setSkipVantagens(false);
        break;
      }
      case 'desvantagem': {
        const erro = pointSystem.selecionarVantagemDesvantagem(tipo, id, sugestaoNome, custo ?? 0);
        if (erro) { setError(erro); return; }
        // P2: reset skip ao selecionar manualmente
        pointSystem.setSkipDesvantagens(false);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointSystem.selecionarVantagemDesvantagem, pointSystem.setSkipVantagens, pointSystem.setSkipDesvantagens]);

  /** P3: Chama backend com continue_stage e avanca somente apos resposta.
   *  Se backend rejeitar avanco (etapa_proxima === etapa_atual), permanece.
   *  Se backend falhar, avanca localmente como fallback.
   *  @param {Object} [estadoOverride] - sobrescreve campos em getEstado() (ex: skip limpa selecoes) */
  const avancarComMestre = useCallback(async (estadoOverride?: Record<string, unknown>) => {
    if (enviandoRef.current) return;

    // Calcular destino esperado (read-only) para fallback e deteccao de revisit
    const info = navigation.getProximaEtapa();
    if (!info) return;

    const etapaAtual = navigation.etapaAtual;
    const estado = estadoOverride ? { ...getEstado(), ...estadoOverride } : getEstado();

    // Revisit: se a proxima etapa ja foi visitada, navegar sem chamar backend
    if (!info.primeiraVisita) {
      navigation.registrarVisita(info.etapa);
      setSugestoes([]);
      if (info.etapa !== 'atributos') {
        bonusCalc.setAtributosSugeridos(null);
      }
      return;
    }

    // Primeira visita: chamar backend ANTES de avancar
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: etapaAtual,
        estado,
        mensagemJogador: '',
        historico: getHistorico(),
        actionMode: 'continue_stage',
        sistema: sistema || 'lunaria',
      }) as MestreResposta;

      // Consumir etapa_proxima do backend como fonte de verdade
      const destino = resultado.etapa_proxima || info.etapa;

      if (destino !== etapaAtual) {
        navigation.registrarVisita(destino);
      }

      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa: destino,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);
    } catch (_err) {
      // Fallback: avancar localmente se backend falhar
      navigation.avancarEtapa();
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Nao foi possivel contatar o Mestre Criador. Continue normalmente ou envie uma mensagem.',
        etapa: info.etapa,
        falha: true,
        timestamp: new Date(),
      }]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.getProximaEtapa, navigation.etapaAtual, navigation.registrarVisita, navigation.avancarEtapa, getEstado, getHistorico, bonusCalc.setAtributosSugeridos, sistema]);

  /** Pular etapa de vantagens ou desvantagens — limpa seleções + avança com estado correto */
  const pularEtapa = useCallback((tipo: 'vantagens' | 'desvantagens') => {
    if (tipo !== 'vantagens' && tipo !== 'desvantagens') return;
    const override: Record<string, unknown> = {};
    if (tipo === 'vantagens') {
      pointSystem.vantagensIds.forEach(id => pointSystem.removerSelecao('vantagem', id));
      pointSystem.setSkipVantagens(true);
      override.vantagens_ids = [];
      override.vantagens_nomes = [];
    } else {
      pointSystem.desvantagensIds.forEach(id => pointSystem.removerSelecao('desvantagem', id));
      pointSystem.setSkipDesvantagens(true);
      override.desvantagens_ids = [];
      override.desvantagens_nomes = [];
    }
    avancarComMestre(override);
  }, [avancarComMestre, pointSystem]);

  return {
    enviarMensagem,
    aplicarSugestaoAtributos,
    selecionarSugestao,
    avancarComMestre,
    pularEtapa,
  };
};
