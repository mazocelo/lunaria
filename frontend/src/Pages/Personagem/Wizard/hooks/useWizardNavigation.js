import { useState, useMemo, useCallback } from 'react';

const ETAPAS = [
  { id: 'boas_vindas', label: 'O Chamado', icon: '✨' },
  { id: 'raca', label: 'Linhagem', icon: '🧬' },
  { id: 'classe', label: 'Vocação', icon: '⚔️' },
  { id: 'background', label: 'Origens', icon: '📖' },
  { id: 'desvantagens', label: 'Marcas', icon: '🔥' },
  { id: 'vantagens', label: 'Dons', icon: '🌟' },
  { id: 'atributos', label: 'Essência', icon: '💎' },
  { id: 'resumo', label: 'Destino', icon: '🏰' },
  { id: 'refinamento', label: 'Ajustes', icon: '⚙️' },
];

/**
 * Gerencia navegação entre etapas do wizard.
 * Responsabilidades: etapa atual, visitadas, concluídas, avançar/navegar.
 */
export const useWizardNavigation = (draftInicial, buildState) => {
  const [etapaAtual, setEtapaAtual] = useState(draftInicial?.etapaAtual || 'boas_vindas');
  const [etapasVisitadas, setEtapasVisitadas] = useState(
    draftInicial?.etapasVisitadas || [draftInicial?.etapaAtual || 'boas_vindas']
  );

  const etapaIndex = useMemo(() => {
    return ETAPAS.findIndex(e => e.id === etapaAtual);
  }, [etapaAtual]);

  // Etapas concluídas (derivadas do estado de build)
  const etapasConcluidas = useMemo(() => {
    const { nome, racaId, classeId, background, vantagensIds, desvantagensIds,
            skipVantagens, skipDesvantagens, bonusAplicados } = buildState;
    const concluidas = [];
    if (nome?.trim()) concluidas.push('boas_vindas');
    if (racaId) concluidas.push('raca');
    if (classeId) concluidas.push('classe');
    if (background?.trim()) concluidas.push('background');
    if (vantagensIds?.length > 0 || skipVantagens) concluidas.push('vantagens');
    if (desvantagensIds?.length > 0 || skipDesvantagens) concluidas.push('desvantagens');
    if (bonusAplicados) concluidas.push('atributos');
    return concluidas;
  }, [buildState.nome, buildState.racaId, buildState.classeId, buildState.background,
      buildState.vantagensIds, buildState.desvantagensIds, buildState.skipVantagens,
      buildState.skipDesvantagens, buildState.bonusAplicados]);

  /** Avança para a próxima etapa (CTA "Continuar") */
  const avancarEtapa = useCallback(() => {
    const idx = ETAPAS.findIndex(e => e.id === etapaAtual);
    if (idx < 0 || idx >= ETAPAS.length - 1) return null;
    const proxima = ETAPAS[idx + 1].id;
    const primeiraVisita = !etapasVisitadas.includes(proxima);
    setEtapaAtual(proxima);
    setEtapasVisitadas(prev => primeiraVisita ? [...prev, proxima] : prev);
    return { etapa: proxima, primeiraVisita };
  }, [etapaAtual, etapasVisitadas]);

  /** Navega para uma etapa já concluída (progress bar) */
  const navegarParaEtapa = useCallback((etapaId) => {
    if (!etapasConcluidas.includes(etapaId)) return;
    setEtapaAtual(etapaId);
    setEtapasVisitadas(prev => prev.includes(etapaId) ? prev : [...prev, etapaId]);
  }, [etapasConcluidas]);

  /** Registra visita ao avançar via resposta da IA */
  const registrarVisita = useCallback((etapaId) => {
    setEtapaAtual(etapaId);
    setEtapasVisitadas(prev => prev.includes(etapaId) ? prev : [...prev, etapaId]);
  }, []);

  /** Reseta navegação para boas_vindas */
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
