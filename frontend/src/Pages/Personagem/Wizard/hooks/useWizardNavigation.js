import { useState, useMemo, useCallback } from 'react';
import { ETAPAS_COMPAT as ETAPAS, STAGE_IDS as ETAPAS_IDS } from '../stages/stageConfig.js';

export const useWizardNavigation = (draftInicial, buildState) => {
  const etapaInicial = ETAPAS_IDS.has(draftInicial?.etapaAtual) ? draftInicial.etapaAtual : 'boas_vindas';
  const [etapaAtual, setEtapaAtual] = useState(etapaInicial);
  const [etapasVisitadas, setEtapasVisitadas] = useState(
    (draftInicial?.etapasVisitadas || [etapaInicial]).filter((etapa) => ETAPAS_IDS.has(etapa))
  );

  const etapaIndex = useMemo(() => ETAPAS.findIndex((e) => e.id === etapaAtual), [etapaAtual]);

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
    } = buildState;

    const concluidas = [];
    if (nome?.trim()) concluidas.push('boas_vindas');
    if (racaId) concluidas.push('raca');
    if (classeId) concluidas.push('classe');
    if (background?.trim()) concluidas.push('background');
    if (desvantagensIds?.length > 0 || skipDesvantagens) concluidas.push('desvantagens');
    if (vantagensIds?.length > 0 || skipVantagens) concluidas.push('vantagens');
    if (bonusAplicados) concluidas.push('atributos');
    return concluidas;
  }, [
    buildState.nome,
    buildState.racaId,
    buildState.classeId,
    buildState.background,
    buildState.vantagensIds,
    buildState.desvantagensIds,
    buildState.skipVantagens,
    buildState.skipDesvantagens,
    buildState.bonusAplicados,
  ]);

  const avancarEtapa = useCallback(() => {
    const idx = ETAPAS.findIndex((e) => e.id === etapaAtual);
    if (idx < 0 || idx >= ETAPAS.length - 1) return null;

    const proxima = ETAPAS[idx + 1].id;
    const primeiraVisita = !etapasVisitadas.includes(proxima);

    setEtapaAtual(proxima);
    setEtapasVisitadas((prev) => (primeiraVisita ? [...prev, proxima] : prev));

    return { etapa: proxima, primeiraVisita };
  }, [etapaAtual, etapasVisitadas]);

  const navegarParaEtapa = useCallback((etapaId) => {
    if (!ETAPAS_IDS.has(etapaId)) return;
    if (!etapasConcluidas.includes(etapaId) && !etapasVisitadas.includes(etapaId)) return;
    setEtapaAtual(etapaId);
    setEtapasVisitadas((prev) => (prev.includes(etapaId) ? prev : [...prev, etapaId]));
  }, [etapasConcluidas, etapasVisitadas]);

  const registrarVisita = useCallback((etapaId) => {
    if (!ETAPAS_IDS.has(etapaId)) return false;
    setEtapaAtual(etapaId);
    setEtapasVisitadas((prev) => (prev.includes(etapaId) ? prev : [...prev, etapaId]));
    return true;
  }, []);

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
    avancarEtapa,
    navegarParaEtapa,
    registrarVisita,
    resetarNavegacao,
  };
};
