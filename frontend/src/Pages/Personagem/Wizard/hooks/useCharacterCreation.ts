import { useState, useCallback, useRef, type MutableRefObject } from 'react';
import { Personagem } from '../../../../models/Personagem';
import { personagemService, apiClient } from '../../../../services/index';
import type { BonusCalculationApi } from './useBonusCalculation';
import { passoNaoBloqueante, recarregarSemBloquear, type FalhaPosCriacao } from '../stages/criacao';
import { mensagemDeErro } from '../stages/mensagemDeErro';

interface CreationEstado {
  nome?: string;
  racaId?: number | string | null;
  classeId?: number | string | null;
  background?: string;
  atributosBase?: Record<string, number>;
  vantagensIds?: Array<number | string>;
  desvantagensIds?: Array<number | string>;
  dndAbilityScores?: Record<string, number>;
  dndAbilitiesConfirmed?: boolean;
  dndSkillsConfirmed?: boolean;
  dndSkillProficiencies?: string[];
  [key: string]: unknown;
}

interface ComboPreviewData {
  combo?: {
    equipamentos?: Array<{ id?: number | string }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface PointSystemMin {
  pontosCriacaoRestantes: number;
  [key: string]: unknown;
}

interface UseCharacterCreationParams {
  getEstado: () => CreationEstado;
  navigate: (path: string) => void;
  comboPreviewData: ComboPreviewData | null;
  comboPreviewLoading: boolean;
  navigation: { etapaAtual?: string; [key: string]: unknown };
  bonusCalc: BonusCalculationApi;
  pointSystem: PointSystemMin;
  estadoRef: MutableRefObject<CreationEstado>;
  setError: (msg: string | null) => void;
  limparDraft: () => void;
  recarregarPersonagens: () => Promise<void>;
  imageUrl?: string | null;
  grimorioSelecionadas?: Array<number | string>;
  sistema?: string;
}

interface CreationResultData {
  personagem: { id?: number | null } | null;
  preview: unknown;
  background_digitado?: string;
  background_gerado?: string | null;
  background_final?: string;
  background_indisponivel?: boolean;
  /** Passos pós-criação que falharam (o personagem existe; o modal avisa). */
  falhas?: FalhaPosCriacao[];
}

/**
 * Encapsulates the character save flow: validation, creation, background
 * generation, result modal state, and post-creation navigation.
 */
export const useCharacterCreation = ({
  getEstado: _getEstado, navigate, comboPreviewData, comboPreviewLoading,
  navigation: _navigation, bonusCalc, pointSystem,
  estadoRef, setError, limparDraft, recarregarPersonagens,
  imageUrl, grimorioSelecionadas, sistema = 'lunaria',
}: UseCharacterCreationParams) => {
  const [salvando, setSalvando] = useState(false);
  const [creationFlowStatus, setCreationFlowStatus] = useState<string>('idle');
  const [creationResultModalOpen, setCreationResultModalOpen] = useState(false);
  const [creationResultData, setCreationResultData] = useState<CreationResultData | null>(null);
  /** Id do personagem já criado nesta sessão do wizard: impede um segundo POST (A35). */
  const criadoIdRef = useRef<number | string | null>(null);

  /** Cria um personagem D&D 5e: valida o estado D&D e envia o payload proprio. */
  const salvarPersonagemDnd5e = useCallback(async (s: CreationEstado) => {
    const scores = s.dndAbilityScores || {};
    const abilityIds = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const scoresCompletos = abilityIds.every(id => scores[id] != null);
    if (!s.dndAbilitiesConfirmed || !scoresCompletos) {
      setError('Confirme a distribuicao dos seis atributos antes de criar.');
      return;
    }
    if (!s.dndSkillsConfirmed) {
      setError('Confirme as pericias antes de criar.');
      return;
    }

    setSalvando(true);
    setError(null);
    setCreationFlowStatus('creating_character');
    setCreationResultModalOpen(false);
    setCreationResultData(null);

    try {
      const payload = {
        nome: s.nome,
        sistema: 'dnd5e',
        raca_id: s.racaId,
        classe_id: s.classeId,
        background: s.background,
        nivel: 1,
        dnd_ability_scores: Object.fromEntries(abilityIds.map(id => [id, scores[id]])),
        metodo: 'standard_array',
        skill_proficiencies: s.dndSkillProficiencies || [],
      };

      const criado = await personagemService.createDnd5e(payload) as { id?: number | null } | null;
      if (criado?.id != null) criadoIdRef.current = criado.id;
      const falhas: FalhaPosCriacao[] = [];

      let backgroundResult: { background_gerado?: string } | null = null;
      let backgroundIndisponivel = false;
      if (criado?.id && s.background) {
        setCreationFlowStatus('generating_background');
        try {
          backgroundResult = await personagemService.gerarBackground(criado.id, s.background) as { background_gerado?: string };
        } catch (bgError) {
          backgroundIndisponivel = true;
          falhas.push('background');
          const msg = bgError instanceof Error ? bgError.message : String(bgError);
          console.warn('Background IA nao gerado:', msg);
        }
      }

      if (criado?.id && imageUrl) {
        const id = criado.id;
        await passoNaoBloqueante(falhas, 'retrato', () => personagemService.update(id, { imagem: imageUrl }));
      }

      limparDraft();
      await recarregarSemBloquear(recarregarPersonagens);

      setCreationFlowStatus('opening_result');
      setCreationResultData({
        personagem: criado,
        preview: null,
        background_digitado: s.background,
        background_gerado: backgroundResult?.background_gerado || null,
        background_final: backgroundResult?.background_gerado || s.background,
        background_indisponivel: backgroundIndisponivel || !backgroundResult?.background_gerado,
        falhas,
      });
      setCreationResultModalOpen(true);
      setCreationFlowStatus('idle');
    } catch (err) {
      // Só chega aqui erro anterior ao POST concluído; depois dele os passos são não bloqueantes.
      setCreationFlowStatus('error');
      console.warn('[wizard] criação falhou', err);
      setError(mensagemDeErro(err));
      setCreationFlowStatus('idle');
    } finally {
      setSalvando(false);
    }
  }, [imageUrl, limparDraft, recarregarPersonagens, setError]);

  /** Salva o personagem usando o combo atual do preview */
  const salvarPersonagem = useCallback(async () => {
    if (criadoIdRef.current != null) { setCreationResultModalOpen(true); return; }
    const s = estadoRef.current;
    if (!s.nome?.trim()) { setError('Nome do personagem e obrigatorio'); return; }
    if (!s.racaId) { setError('Selecione uma raca antes de salvar'); return; }
    if (!s.classeId) { setError('Selecione uma classe antes de salvar'); return; }
    if (!s.background?.trim()) { setError('Descreva a origem do personagem antes de salvar'); return; }

    if (sistema === 'dnd5e') {
      await salvarPersonagemDnd5e(s);
      return;
    }

    if (!bonusCalc.bonusAplicados) {
      setError('Confirme seus atributos antes de salvar.');
      return;
    }
    if (pointSystem.pontosCriacaoRestantes < 0) {
      setError('A ficha excede o orcamento de criacao.');
      return;
    }
    if (comboPreviewLoading) {
      setError('A resolutiva ainda esta sendo preparada. Aguarde um instante.');
      return;
    }
    if (!comboPreviewData?.combo) {
      setError('A resolutiva final ainda nao esta disponivel. Gere o combo antes de criar.');
      return;
    }

    setSalvando(true);
    setError(null);
    setCreationFlowStatus('creating_character');
    setCreationResultModalOpen(false);
    setCreationResultData(null);

    try {
      const base = s.atributosBase || {};
      const dados = {
        nome: s.nome,
        raca_id: s.racaId,
        classe_id: s.classeId,
        sugestao_background: 'guiado',
        background: s.background,
        sistema,
        forca: base.forca,
        destreza: base.destreza,
        constituicao: base.constituicao,
        inteligencia: base.inteligencia,
        agilidade: base.agilidade,
        carisma: base.carisma,
        vantagens: s.vantagensIds,
        desvantagens: s.desvantagensIds,
        equipamentos: (comboPreviewData?.combo?.equipamentos || []).map((item) => item.id),
        nivel: 1,
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem, { context: 'criacao' }) as { id?: number | null } | null;
      if (criado?.id != null) criadoIdRef.current = criado.id;
      const falhas: FalhaPosCriacao[] = [];

      let backgroundResult: { background_gerado?: string } | null = null;
      let backgroundIndisponivel = false;
      if (criado?.id && s.background) {
        setCreationFlowStatus('generating_background');
        try {
          backgroundResult = await personagemService.gerarBackground(criado.id, s.background) as { background_gerado?: string };
        } catch (bgError) {
          backgroundIndisponivel = true;
          falhas.push('background');
          const msg = bgError instanceof Error ? bgError.message : String(bgError);
          console.warn('Background IA nao gerado:', msg);
        }
      }

      if (criado?.id && imageUrl) {
        const id = criado.id;
        await passoNaoBloqueante(falhas, 'retrato', () => personagemService.update(id, { imagem: imageUrl }));
      }

      if (criado?.id && (grimorioSelecionadas?.length ?? 0) > 0) {
        const id = criado.id;
        await passoNaoBloqueante(falhas, 'magias', () => apiClient.post(`/personagens/${id}/magias`, {
          habilidade_ids: (grimorioSelecionadas || []).map(hid => parseInt(String(hid), 10)),
          origem: 'criacao',
        }));
      }

      limparDraft();
      await recarregarSemBloquear(recarregarPersonagens);

      setCreationFlowStatus('opening_result');
      setCreationResultData({
        personagem: criado,
        preview: comboPreviewData,
        background_digitado: s.background,
        background_gerado: backgroundResult?.background_gerado || null,
        background_final: backgroundResult?.background_gerado || s.background,
        background_indisponivel: backgroundIndisponivel || !backgroundResult?.background_gerado,
        falhas,
      });
      setCreationResultModalOpen(true);
      setCreationFlowStatus('idle');
    } catch (err) {
      // Só chega aqui erro anterior ao POST concluído; depois dele os passos são não bloqueantes.
      setCreationFlowStatus('error');
      console.warn('[wizard] criação falhou', err);
      setError(mensagemDeErro(err));
      setCreationFlowStatus('idle');
    } finally {
      setSalvando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bonusCalc.bonusAplicados,
    pointSystem.pontosCriacaoRestantes,
    comboPreviewLoading,
    comboPreviewData,
    recarregarPersonagens,
    limparDraft,
    imageUrl,
    grimorioSelecionadas,
    sistema,
    salvarPersonagemDnd5e,
  ]);

  const limparOuDefinirResultado = useCallback((data: CreationResultData | null) => {
    if (data == null) criadoIdRef.current = null;
    setCreationResultData(data);
  }, []);

  /** Fecha o modal de resultado de criação */
  const fecharResultadoCriacao = useCallback(() => {
    setCreationResultModalOpen(false);
  }, []);

  /** Navega para a lista de personagens */
  const irParaPersonagens = useCallback(() => {
    setCreationResultModalOpen(false);
    navigate('/personagens');
  }, [navigate]);

  /** Navega para a ficha do personagem recém-criado */
  const verFichaCriada = useCallback(() => {
    const personagemId = creationResultData?.personagem?.id;
    setCreationResultModalOpen(false);
    if (personagemId) {
      navigate(`/personagens/${personagemId}`);
      return;
    }
    navigate('/personagens');
  }, [creationResultData, navigate]);

  return {
    salvando,
    creationFlowStatus,
    creationResultModalOpen,
    creationResultData,
    salvarPersonagem,
    fecharResultadoCriacao,
    irParaPersonagens,
    verFichaCriada,
    // Exposed for descartarDraft reset
    setCreationFlowStatus,
    setCreationResultModalOpen,
    /** Com `null` ("Começar do zero") também esquece o personagem criado, liberando uma nova criação. */
    setCreationResultData: limparOuDefinirResultado,
  };
};
