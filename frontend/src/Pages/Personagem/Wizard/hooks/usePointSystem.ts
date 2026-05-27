import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { tierDesbloqueado } from '../../../../utils/evolucaoHelper';
import type { WizardDraft } from './useDraftPersistence';

// Alinhado com Backend/helpers/evolucaoHelper.js
const MAX_CUSTO_DESVANTAGEM = -3; // maxCustoDesvantagem(nivel=1) = 3
const PONTOS_CRIACAO_BASE = 10;   // pontosVantagemBase(nivel=1) = 10
const TIER_CRIACAO = tierDesbloqueado(1);

interface CatalogoItem {
  id?: number | string;
  nome?: string;
  custo?: number;
  nivel?: number;
  compravel?: boolean;
}

interface UsePointSystemParams {
  draftInicial?: WizardDraft | null;
  vantagensDisponiveis?: CatalogoItem[];
  vantagensStore?: CatalogoItem[];
  desvantagensStore?: CatalogoItem[];
  racaId?: number | string | null;
  classeId?: number | string | null;
  racasDisponiveis?: CatalogoItem[];
  classesDisponiveis?: CatalogoItem[];
}

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
}: UsePointSystemParams) => {
  const [vantagensIds, setVantagensIds] = useState<Array<number | string>>(draftInicial?.vantagensIds || []);
  const [vantagensNomes, setVantagensNomes] = useState<string[]>(draftInicial?.vantagensNomes || []);
  const [desvantagensIds, setDesvantagensIds] = useState<Array<number | string>>(draftInicial?.desvantagensIds || []);
  const [desvantagensNomes, setDesvantagensNomes] = useState<string[]>(draftInicial?.desvantagensNomes || []);

  const [skipVantagens, setSkipVantagens] = useState<boolean>(draftInicial?.skipVantagens || false);
  const [skipDesvantagens, setSkipDesvantagens] = useState<boolean>(draftInicial?.skipDesvantagens || false);

  // Sanear IDs de draft restaurado: remover itens fora do catálogo filtrado
  const draftSaneado = useRef(false);
  useEffect(() => {
    if (draftSaneado.current || !vantagensDisponiveis?.length) return;
    draftSaneado.current = true;
    const idsValidos = new Set(vantagensDisponiveis.map(v => String(v.id)));

    setVantagensIds(prev => {
      const filtrados = prev.filter(id => idsValidos.has(String(id)));
      return filtrados.length === prev.length ? prev : filtrados;
    });
    setVantagensNomes(prev => {
      const nomesValidos = new Set(vantagensDisponiveis.filter(v => (v.custo ?? 0) > 0 || v.compravel !== false).map(v => v.nome).filter((n): n is string => !!n));
      const filtrados = prev.filter(n => nomesValidos.has(n));
      return filtrados.length === prev.length ? prev : filtrados;
    });
    setDesvantagensIds(prev => {
      const filtrados = prev.filter(id => idsValidos.has(String(id)));
      return filtrados.length === prev.length ? prev : filtrados;
    });
    setDesvantagensNomes(prev => {
      const nomesValidos = new Set(vantagensDisponiveis.filter(v => (v.custo ?? 0) < 0).map(v => v.nome).filter((n): n is string => !!n));
      const filtrados = prev.filter(n => nomesValidos.has(n));
      return filtrados.length === prev.length ? prev : filtrados;
    });
  }, [vantagensDisponiveis]);

  // Pontos de desvantagem usados (soma dos custos negativos)
  const pontosDesvantagem = useMemo<number>(() => {
    const allItems = vantagensDisponiveis || [];
    return desvantagensIds.reduce<number>((sum, id) => {
      const item = allItems.find(v => String(v.id) === String(id));
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [desvantagensIds, vantagensDisponiveis]);

  // Pontos de vantagem usados (soma dos custos positivos)
  const pontosVantagem = useMemo<number>(() => {
    const allItems = vantagensDisponiveis || [];
    return vantagensIds.reduce<number>((sum, id) => {
      const item = allItems.find(v => String(v.id) === String(id));
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [vantagensIds, vantagensDisponiveis]);

  // Custo de raça e classe
  const custoRaca = useMemo<number>(() => {
    if (!racaId) return 0;
    const raca = (racasDisponiveis || []).find(r => String(r.id) === String(racaId));
    return raca ? Number(raca.custo) || 0 : 0;
  }, [racaId, racasDisponiveis]);

  const custoClasse = useMemo<number>(() => {
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
  const removerSelecao = useCallback((tipo: 'vantagem' | 'desvantagem', id: number | string) => {
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
  const selecionarVantagemDesvantagem = useCallback((tipo: 'vantagem' | 'desvantagem', id: number | string, nome: string, custo: number | string): string | null => {
    const matchId = (stored: number | string) => String(stored) === String(id);

    // Permitir toggle (desseleção) mesmo para itens fora do catálogo
    if (tipo === 'vantagem') {
      const existente = vantagensIds.find(matchId);
      if (existente !== undefined) {
        removerSelecao('vantagem', existente);
        return null;
      }
    } else if (tipo === 'desvantagem') {
      const existente = desvantagensIds.find(matchId);
      if (existente !== undefined) {
        removerSelecao('desvantagem', existente);
        return null;
      }
    }

    // Gate de tier: bloquear adição de itens ausentes do catálogo filtrado
    const itemCatalogo = (vantagensDisponiveis || []).find(v => String(v.id) === String(id));
    if (!itemCatalogo) {
      return `"${nome}" nao esta disponivel para selecao neste nivel`;
    }
    if ((itemCatalogo.nivel || 1) > TIER_CRIACAO) {
      return `"${nome}" requer tier ${itemCatalogo.nivel}, mas a criacao so permite tier ${TIER_CRIACAO}`;
    }

    if (tipo === 'vantagem') {
      const custoNum = Number(custo) || 0;
      if (custoNum > pontosCriacaoRestantes) {
        return `Pontos de criação insuficientes. Disponível: ${pontosCriacaoRestantes}, Custo: ${custoNum}`;
      }
      setVantagensIds(prev => [...prev, id]);
      setVantagensNomes(prev => [...prev, nome]);
    } else if (tipo === 'desvantagem') {
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
