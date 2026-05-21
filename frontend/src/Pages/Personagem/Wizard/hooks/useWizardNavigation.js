import { useState, useMemo, useCallback } from 'react';
import { getSystemStages } from '../stages/stageConfig.js';

export const useWizardNavigation = (draftInicial, buildState, sistema = 'lunaria') => {
  const { etapas: ETAPAS, ids: ETAPAS_IDS } = useMemo(() => getSystemStages(sistema), [sistema]);

  const etapaInicial = ETAPAS_IDS.has(draftInicial?.etapaAtual) ? draftInicial.etapaAtual : 'boas_vindas';
  const [etapaAtual, setEtapaAtual] = useState(etapaInicial);
  const [etapasVisitadas, setEtapasVisitadas] = useState(
    (draftInicial?.etapasVisitadas || [etapaInicial]).filter((etapa) => ETAPAS_IDS.has(etapa))
  );

  const etapaIndex = useMemo(() => ETAPAS.findIndex((e) => e.id === etapaAtual), [etapaAtual, ETAPAS]);

  const etapasConcluidas = useMemo(() => {
    const {
      nome,
      racaId,
      classeId,
      background,
      vantagensIds,
      desvantagensIds,
      skipVantagens,
      skipDesvantagens,
      bonusAplicados,
      comboPreviewData,
      grimorioSelecionado,
      caracteristicasDistribuidas,
      vantagensSelecionadas,
      desvantagensSelecionadas,
      magiasSelecionadas,
    } = buildState;

    const concluidas = [];

    if (sistema === 'tresdet') {
      if (nome?.trim()) concluidas.push('boas_vindas');
      if (background?.trim()) concluidas.push('conceito');
      if (caracteristicasDistribuidas) concluidas.push('caracteristicas');
      if (vantagensSelecionadas || skipVantagens) concluidas.push('vantagens');
      if (desvantagensSelecionadas || skipDesvantagens) concluidas.push('desvantagens');
      if (comboPreviewData) concluidas.push('equipamentos');
      if (magiasSelecionadas) concluidas.push('magias');
    } else {
      if (nome?.trim()) concluidas.push('boas_vindas');
      if (racaId) concluidas.push('raca');
      if (classeId) concluidas.push('classe');
      if (background?.trim()) concluidas.push('background');
      if (desvantagensIds?.length > 0 || skipDesvantagens) concluidas.push('desvantagens');
      if (vantagensIds?.length > 0 || skipVantagens) concluidas.push('vantagens');
      if (bonusAplicados) concluidas.push('atributos');
      if (comboPreviewData) concluidas.push('equipamentos');
      if (grimorioSelecionado) concluidas.push('grimorio');
    }
    return concluidas;
  }, [
    sistema,
    buildState.nome,
    buildState.racaId,
    buildState.classeId,
    buildState.background,
    buildState.vantagensIds,
    buildState.desvantagensIds,
    buildState.skipVantagens,
    buildState.skipDesvantagens,
    buildState.bonusAplicados,
    buildState.comboPreviewData,
    buildState.grimorioSelecionado,
    buildState.caracteristicasDistribuidas,
    buildState.vantagensSelecionadas,
    buildState.desvantagensSelecionadas,
    buildState.magiasSelecionadas,
  ]);

  /** Retorna info da proxima etapa sem navegar (read-only) */
  const getProximaEtapa = useCallback(() => {
    const idx = ETAPAS.findIndex((e) => e.id === etapaAtual);
    if (idx < 0 || idx >= ETAPAS.length - 1) return null;
    const proxima = ETAPAS[idx + 1].id;
    return { etapa: proxima, primeiraVisita: !etapasVisitadas.includes(proxima) };
  }, [etapaAtual, etapasVisitadas, ETAPAS]);

  /** Avanca para a proxima etapa localmente (idx + 1). Usado como fallback. */
  const avancarEtapa = useCallback(() => {
    const info = getProximaEtapa();
    if (!info) return null;
    setEtapaAtual(info.etapa);
    setEtapasVisitadas((prev) => (info.primeiraVisita ? [...prev, info.etapa] : prev));
    return info;
  }, [getProximaEtapa]);

  const navegarParaEtapa = useCallback((etapaId) => {
    if (!ETAPAS_IDS.has(etapaId)) return;
    if (!etapasConcluidas.includes(etapaId) && !etapasVisitadas.includes(etapaId)) return;
    setEtapaAtual(etapaId);
    setEtapasVisitadas((prev) => (prev.includes(etapaId) ? prev : [...prev, etapaId]));
  }, [etapasConcluidas, etapasVisitadas, ETAPAS_IDS]);

  const registrarVisita = useCallback((etapaId) => {
    if (!ETAPAS_IDS.has(etapaId)) return false;
    setEtapaAtual(etapaId);
    setEtapasVisitadas((prev) => (prev.includes(etapaId) ? prev : [...prev, etapaId]));
    return true;
  }, [ETAPAS_IDS]);

  const resetarNavegacao = useCallback(() => {
    setEtapaAtual('boas_vindas');
    setEtapasVisitadas(['boas_vindas']);
  }, []);

  return {
    etapas: ETAPAS,
    etapaAtual,
    etapaIndex,
    etapasVisitadas,
    etapasConcluidas,
    getProximaEtapa,
    avancarEtapa,
    navegarParaEtapa,
    registrarVisita,
    resetarNavegacao,
  };
};
