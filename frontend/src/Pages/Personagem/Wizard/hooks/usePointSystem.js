import { useState, useMemo, useCallback } from 'react';

const MAX_DESVANTAGENS = 3;
const MAX_PONTOS_DESVANTAGEM = -4;
const PONTOS_CRIACAO_BASE = 5;

/**
 * Gerencia pontos de criação, seleção de vantagens/desvantagens e limites.
 * Responsabilidades: custos, limites, selecionarSugestao, removerSelecao.
 */
export const usePointSystem = ({
  draftInicial,
  vantagensDisponiveis,
  vantagensStore,
  desvantagensStore,
}) => {
  const [vantagensIds, setVantagensIds] = useState(draftInicial?.vantagensIds || []);
  const [vantagensNomes, setVantagensNomes] = useState(draftInicial?.vantagensNomes || []);
  const [desvantagensIds, setDesvantagensIds] = useState(draftInicial?.desvantagensIds || []);
  const [desvantagensNomes, setDesvantagensNomes] = useState(draftInicial?.desvantagensNomes || []);

  const [skipVantagens, setSkipVantagens] = useState(draftInicial?.skipVantagens || false);
  const [skipDesvantagens, setSkipDesvantagens] = useState(draftInicial?.skipDesvantagens || false);

  // Pontos de desvantagem usados (soma dos custos negativos)
  const pontosDesvantagem = useMemo(() => {
    const allItems = vantagensDisponiveis || [];
    return desvantagensIds.reduce((sum, id) => {
      const item = allItems.find(v => v.id === id);
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [desvantagensIds, vantagensDisponiveis]);

  // Pontos de vantagem usados (soma dos custos positivos)
  const pontosVantagem = useMemo(() => {
    const allItems = vantagensDisponiveis || [];
    return vantagensIds.reduce((sum, id) => {
      const item = allItems.find(v => v.id === id);
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [vantagensIds, vantagensDisponiveis]);

  // Pontos de criação disponíveis
  const pontosDevolvidos = Math.min(Math.abs(MAX_PONTOS_DESVANTAGEM), Math.abs(pontosDesvantagem));
  const pontosCriacaoTotal = PONTOS_CRIACAO_BASE + pontosDevolvidos;
  const pontosCriacaoRestantes = pontosCriacaoTotal - pontosVantagem;

  /** Seleciona uma vantagem ou desvantagem, validando limites. Retorna erro string ou null. */
  const selecionarVantagemDesvantagem = useCallback((tipo, id, nome, custo) => {
    if (tipo === 'vantagem') {
      if (vantagensIds.includes(id)) return null;
      const custoNum = Number(custo) || 0;
      if (custoNum > pontosCriacaoRestantes) {
        return `Pontos de criação insuficientes. Disponível: ${pontosCriacaoRestantes}, Custo: ${custoNum}`;
      }
      setVantagensIds(prev => [...prev, id]);
      setVantagensNomes(prev => [...prev, nome]);
    } else if (tipo === 'desvantagem') {
      if (desvantagensIds.includes(id)) return null;
      if (desvantagensIds.length >= MAX_DESVANTAGENS) {
        return `Máximo de ${MAX_DESVANTAGENS} desvantagens por personagem`;
      }
      const custoNum = Number(custo) || 0;
      if (pontosDesvantagem + custoNum < MAX_PONTOS_DESVANTAGEM) {
        return `Limite de ${Math.abs(MAX_PONTOS_DESVANTAGEM)} pontos de desvantagem atingido (atual: ${Math.abs(pontosDesvantagem)})`;
      }
      setDesvantagensIds(prev => [...prev, id]);
      setDesvantagensNomes(prev => [...prev, nome]);
    }
    return null;
  }, [vantagensIds, desvantagensIds, pontosCriacaoRestantes, pontosDesvantagem]);

  /** Remove uma vantagem/desvantagem selecionada */
  const removerSelecao = useCallback((tipo, id) => {
    if (tipo === 'vantagem') {
      setVantagensIds(prev => prev.filter(v => v !== id));
      setVantagensNomes(prev => {
        const item = (vantagensStore || []).find(v => v.id === id);
        return prev.filter(n => n !== item?.nome);
      });
    } else {
      setDesvantagensIds(prev => prev.filter(d => d !== id));
      setDesvantagensNomes(prev => {
        const item = (desvantagensStore || []).find(d => d.id === id);
        return prev.filter(n => n !== item?.nome);
      });
    }
  }, [vantagensStore, desvantagensStore]);

  /** Reseta todas as seleções */
  const resetarSelecoes = useCallback(() => {
    setVantagensIds([]);
    setVantagensNomes([]);
    setDesvantagensIds([]);
    setDesvantagensNomes([]);
    setSkipVantagens(false);
    setSkipDesvantagens(false);
  }, []);

  return {
    vantagensIds,
    vantagensNomes,
    desvantagensIds,
    desvantagensNomes,
    skipVantagens,
    setSkipVantagens,
    skipDesvantagens,
    setSkipDesvantagens,
    pontosVantagem,
    pontosDesvantagem,
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    maxDesvantagens: MAX_DESVANTAGENS,
    selecionarVantagemDesvantagem,
    removerSelecao,
    resetarSelecoes,
  };
};
