
import { useState, useCallback } from 'react';
import { Personagem } from '../../../../models/Personagem';
import { personagemService, apiClient } from '../../../../services/index.js';

/**
 * Encapsulates the character save flow: validation, creation, background
 * generation, result modal state, and post-creation navigation.
 */
export const useCharacterCreation = ({
  getEstado, navigate, comboPreviewData, comboPreviewLoading,
  navigation, bonusCalc, pointSystem,
  estadoRef, setError, limparDraft, recarregarPersonagens,
  imageUrl, grimorioSelecionadas,
}) => {
  const [salvando, setSalvando] = useState(false);
  const [creationFlowStatus, setCreationFlowStatus] = useState('idle');
  const [creationResultModalOpen, setCreationResultModalOpen] = useState(false);
  const [creationResultData, setCreationResultData] = useState(null);

  /** Salva o personagem usando o combo atual do preview */
  const salvarPersonagem = useCallback(async () => {
    const s = estadoRef.current;
    if (!s.nome?.trim()) { setError('Nome do personagem e obrigatorio'); return; }
    if (!s.racaId) { setError('Selecione uma raca antes de salvar'); return; }
    if (!s.classeId) { setError('Selecione uma classe antes de salvar'); return; }
    if (!s.background?.trim()) { setError('Descreva a origem do personagem antes de salvar'); return; }
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
      const base = s.atributosBase;
      const dados = {
        nome: s.nome,
        raca_id: s.racaId,
        classe_id: s.classeId,
        sugestao_background: 'guiado',
        background: s.background,
        forca: base.forca,
        destreza: base.destreza,
        constituicao: base.constituicao,
        inteligencia: base.inteligencia,
        agilidade: base.agilidade,
        carisma: base.carisma,
        vantagens: s.vantagensIds,
        desvantagens: s.desvantagensIds,
        equipamentos: (comboPreviewData.combo.equipamentos || []).map((item) => item.id),
        nivel: 1,
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem, { context: 'criacao' });

      let backgroundResult = null;
      let backgroundIndisponivel = false;
      if (criado?.id && s.background) {
        setCreationFlowStatus('generating_background');
        try {
          backgroundResult = await personagemService.gerarBackground(criado.id, s.background);
        } catch (bgError) {
          backgroundIndisponivel = true;
          console.warn('Background IA nao gerado:', bgError.message);
        }
      }

      if (criado?.id && imageUrl) {
        try {
          await personagemService.update(criado.id, { imagem: imageUrl });
        } catch { /* non-blocking */ }
      }

      if (criado?.id && grimorioSelecionadas?.length > 0) {
        try {
          await apiClient.post(`/personagens/${criado.id}/magias`, {
            habilidade_ids: grimorioSelecionadas.map(id => parseInt(id, 10)),
            origem: 'criacao',
          });
        } catch { /* non-blocking — magias podem ser adicionadas depois */ }
      }

      limparDraft();
      await recarregarPersonagens();

      setCreationFlowStatus('opening_result');
      setCreationResultData({
        personagem: criado,
        preview: comboPreviewData,
        background_digitado: s.background,
        background_gerado: backgroundResult?.background_gerado || null,
        background_final: backgroundResult?.background_gerado || s.background,
        background_indisponivel: backgroundIndisponivel || !backgroundResult?.background_gerado,
      });
      setCreationResultModalOpen(true);
      setCreationFlowStatus('idle');
    } catch (err) {
      setCreationFlowStatus('error');
      setError(err.message || 'Erro ao criar personagem');
      setCreationFlowStatus('idle');
    } finally {
      setSalvando(false);
    }
  }, [
    bonusCalc.bonusAplicados,
    pointSystem.pontosCriacaoRestantes,
    comboPreviewLoading,
    comboPreviewData,
    recarregarPersonagens,
    limparDraft,
    imageUrl,
    grimorioSelecionadas,
  ]);

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
    setCreationResultData,
  };
};
