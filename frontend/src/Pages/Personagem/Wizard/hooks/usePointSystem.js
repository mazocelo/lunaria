import { useState, useMemo, useCallback } from 'react';
import { tierDesbloqueado } from '../../../../utils/evolucaoHelper.js';

// Alinhado com Backend/helpers/evolucaoHelper.js
const MAX_CUSTO_DESVANTAGEM = -3; // maxCustoDesvantagem(nivel=1) = 3
const PONTOS_CRIACAO_BASE = 10;   // pontosVantagemBase(nivel=1) = 10
const TIER_CRIACAO = tierDesbloqueado(1);

/**
 * Gerencia pontos de criação, seleção de vantagens/desvantagens e limites.
 * Responsabilidades: custos, limites, selecionarSugestao, removerSelecao.
 */
export const usePointSystem = ({
  draftInicial,
  vantagensDisponiveis,
  vantagensStore,
  desvantagensStore,
  racaId,
  classeId,
  racasDisponiveis,
  classesDisponiveis,
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
      const item = allItems.find(v => String(v.id) === String(id));
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [desvantagensIds, vantagensDisponiveis]);

  // Pontos de vantagem usados (soma dos custos positivos)
  const pontosVantagem = useMemo(() => {
    const allItems = vantagensDisponiveis || [];
    return vantagensIds.reduce((sum, id) => {
      const item = allItems.find(v => String(v.id) === String(id));
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [vantagensIds, vantagensDisponiveis]);

  // Custo de raça e classe
  const custoRaca = useMemo(() => {
    if (!racaId) return 0;
    const raca = (racasDisponiveis || []).find(r => String(r.id) === String(racaId));
    return raca ? Number(raca.custo) || 0 : 0;
  }, [racaId, racasDisponiveis]);

  const custoClasse = useMemo(() => {
    if (!classeId) return 0;
    const classe = (classesDisponiveis || []).find(c => String(c.id) === String(classeId));
    return classe ? Number(classe.custo) || 0 : 0;
  }, [classeId, classesDisponiveis]);

  // Pontos de criação: base - custos + devolução de desvantagens
  // Fórmula backend: pontosVantagemBase(nivel) - racaCusto - classeCusto + custoDesvantagensAceitas
  const pontosDevolvidos = Math.min(Math.abs(MAX_CUSTO_DESVANTAGEM), Math.abs(pontosDesvantagem));
  const pontosCriacaoTotal = PONTOS_CRIACAO_BASE + pontosDevolvidos;
  const pontosGastos = custoRaca + custoClasse + pontosVantagem;
  const pontosCriacaoRestantes = pontosCriacaoTotal - pontosGastos;

  /** Remove uma vantagem/desvantagem selecionada */
  const removerSelecao = useCallback((tipo, id) => {
    if (tipo === 'vantagem') {
      setVantagensIds(prev => prev.filter(v => String(v) !== String(id)));
      setVantagensNomes(prev => {
        const item = (vantagensStore || []).find(v => String(v.id) === String(id));
        return prev.filter(n => n !== item?.nome);
      });
    } else {
      setDesvantagensIds(prev => prev.filter(d => String(d) !== String(id)));
      setDesvantagensNomes(prev => {
        const item = (desvantagensStore || []).find(d => String(d.id) === String(id));
        return prev.filter(n => n !== item?.nome);
      });
    }
  }, [vantagensStore, desvantagensStore]);

  /** Seleciona ou desseleciona uma vantagem/desvantagem, validando limites. Retorna erro string ou null. */
  const selecionarVantagemDesvantagem = useCallback((tipo, id, nome, custo) => {
    // Gate de tier: bloquear itens acima do tier permitido na criacao
    const itemCatalogo = (vantagensDisponiveis || []).find(v => String(v.id) === String(id));
    if (itemCatalogo && (itemCatalogo.nivel || 1) > TIER_CRIACAO) {
      return `"${nome}" requer tier ${itemCatalogo.nivel}, mas a criacao so permite tier ${TIER_CRIACAO}`;
    }

    const matchId = (stored) => String(stored) === String(id);
    if (tipo === 'vantagem') {
      const existente = vantagensIds.find(matchId);
      if (existente !== undefined) {
        removerSelecao('vantagem', existente);
        return null;
      }
      const custoNum = Number(custo) || 0;
      if (custoNum > pontosCriacaoRestantes) {
        return `Pontos de criação insuficientes. Disponível: ${pontosCriacaoRestantes}, Custo: ${custoNum}`;
      }
      setVantagensIds(prev => [...prev, id]);
      setVantagensNomes(prev => [...prev, nome]);
    } else if (tipo === 'desvantagem') {
      const existente = desvantagensIds.find(matchId);
      if (existente !== undefined) {
        removerSelecao('desvantagem', existente);
        return null;
      }
      const custoNum = Number(custo) || 0;
      if (pontosDesvantagem + custoNum < MAX_CUSTO_DESVANTAGEM) {
        return `Limite de ${Math.abs(MAX_CUSTO_DESVANTAGEM)} pontos de desvantagem atingido (atual: ${Math.abs(pontosDesvantagem)})`;
      }
      setDesvantagensIds(prev => [...prev, id]);
      setDesvantagensNomes(prev => [...prev, nome]);
    }
    return null;
  }, [vantagensIds, desvantagensIds, pontosCriacaoRestantes, pontosDesvantagem, removerSelecao, vantagensDisponiveis]);

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
    custoRaca,
    custoClasse,
    pontosGastos,
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    maxCustoDesvantagem: Math.abs(MAX_CUSTO_DESVANTAGEM),
    selecionarVantagemDesvantagem,
    removerSelecao,
    resetarSelecoes,
  };
};
