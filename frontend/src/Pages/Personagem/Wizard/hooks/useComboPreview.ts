import { useState, useEffect, useMemo, useCallback, useRef, type MutableRefObject } from 'react';
import { personagemService } from '../../../../services/index';

interface ComboItem {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface ComboPreviewData {
  combo?: {
    equipamentos?: ComboItem[];
    habilidades?: ComboItem[];
    magias?: ComboItem[];
  };
  [key: string]: unknown;
}

interface ComboPreviewState {
  nome?: string;
  racaId?: number | string | null;
  classeId?: number | string | null;
  background?: string;
  atributosBase?: Record<string, number>;
  vantagensIds?: Array<number | string>;
  desvantagensIds?: Array<number | string>;
}

interface UseComboPreviewParams {
  nome?: string;
  racaId?: number | string | null;
  classeId?: number | string | null;
  background?: string;
  bonusAplicados?: boolean;
  pontosCriacaoRestantes: number;
  vantagensIds: Array<number | string>;
  desvantagensIds: Array<number | string>;
  atributosBase: Record<string, number>;
  estadoRef: MutableRefObject<ComboPreviewState>;
}

interface FlatComboEntry {
  grupo: 'equipamento' | 'habilidade' | 'magia';
  id?: number | string;
  nome?: string;
}

export const useComboPreview = ({
  nome, racaId, classeId, background,
  bonusAplicados, pontosCriacaoRestantes,
  vantagensIds, desvantagensIds,
  atributosBase,
  estadoRef,
}: UseComboPreviewParams) => {
  const [comboPreviewData, setComboPreviewData] = useState<ComboPreviewData | null>(null);
  const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
  const [comboPreviewErro, setComboPreviewErro] = useState<string | null>(null);
  const [comboPreviewTentativa, setComboPreviewTentativa] = useState(0);
  const previewRequestRef = useRef(0);
  const comboPreviewLoadedKeyRef = useRef<string | null>(null);

  const podeGerarPreview = useMemo(() => (
    !!nome?.trim()
    && !!racaId
    && !!classeId
    && !!background?.trim()
    && !!bonusAplicados
    && pontosCriacaoRestantes >= 0
  ), [
    nome,
    racaId,
    classeId,
    background,
    bonusAplicados,
    pontosCriacaoRestantes,
  ]);

  const comboPreviewBuildKey = useMemo(() => JSON.stringify({
    nome: nome?.trim() || '',
    racaId: racaId || null,
    classeId: classeId || null,
    background: background?.trim() || '',
    atributosBase,
    vantagensIds,
    desvantagensIds,
    bonusAplicados,
    pontosCriacaoRestantes,
  }), [
    nome,
    racaId,
    classeId,
    background,
    atributosBase,
    vantagensIds,
    desvantagensIds,
    bonusAplicados,
    pontosCriacaoRestantes,
  ]);

  const montarDraftPreview = useCallback(() => {
    const s = estadoRef.current;
    return {
      nome: s.nome,
      raca_id: s.racaId,
      classe_id: s.classeId,
      background: s.background,
      nivel: 1,
      atributos: s.atributosBase,
      vantagens_ids: s.vantagensIds,
      desvantagens_ids: s.desvantagensIds,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flattenComboPreview = useCallback((combo: ComboPreviewData['combo']): FlatComboEntry[] => ([
    ...((combo?.equipamentos || []).map(item => ({ grupo: 'equipamento' as const, id: item.id, nome: item.nome }))),
    ...((combo?.habilidades || []).map(item => ({ grupo: 'habilidade' as const, id: item.id, nome: item.nome }))),
    ...((combo?.magias || []).map(item => ({ grupo: 'magia' as const, id: item.id, nome: item.nome }))),
  ]), []);

  const carregarComboPreview = useCallback(async (tentativa: number = 0, comboAnterior: FlatComboEntry[] = []): Promise<ComboPreviewData | null> => {
    if (!podeGerarPreview) return null;

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    comboPreviewLoadedKeyRef.current = comboPreviewBuildKey;

    setComboPreviewLoading(true);
    setComboPreviewErro(null);

    try {
      const resultado = await personagemService.gerarFinalizacaoPreview(
        montarDraftPreview(),
        tentativa,
        comboAnterior
      ) as ComboPreviewData;

      if (previewRequestRef.current !== requestId) return null;

      setComboPreviewData(resultado);
      setComboPreviewTentativa(tentativa);
      return resultado;
    } catch (err) {
      if (previewRequestRef.current !== requestId) return null;
      const message = err instanceof Error ? err.message : 'Nao foi possivel gerar a resolutiva final.';
      setComboPreviewErro(message);
      if (tentativa === 0) {
        setComboPreviewData(null);
      }
      return null;
    } finally {
      if (previewRequestRef.current === requestId) {
        setComboPreviewLoading(false);
      }
    }
  }, [podeGerarPreview, montarDraftPreview, comboPreviewBuildKey]);

  const regenerarComboPreview = useCallback(async () => {
    if (!comboPreviewData || comboPreviewLoading || comboPreviewTentativa >= 3) return;
    await carregarComboPreview(
      comboPreviewTentativa + 1,
      flattenComboPreview(comboPreviewData.combo)
    );
  }, [
    comboPreviewData,
    comboPreviewLoading,
    comboPreviewTentativa,
    carregarComboPreview,
    flattenComboPreview,
  ]);

  const recarregarComboPreview = useCallback(async () => {
    const tentativa = comboPreviewData ? comboPreviewTentativa : 0;
    const anterior = comboPreviewData ? flattenComboPreview(comboPreviewData.combo) : [];
    await carregarComboPreview(tentativa, anterior);
  }, [carregarComboPreview, comboPreviewData, comboPreviewTentativa, flattenComboPreview]);

  // Cache invalidation: clear preview when build changes
  useEffect(() => {
    if (comboPreviewLoadedKeyRef.current && comboPreviewLoadedKeyRef.current !== comboPreviewBuildKey) {
      setComboPreviewData(null);
      setComboPreviewErro(null);
      setComboPreviewTentativa(0);
    }
  }, [comboPreviewBuildKey]);

  /** Whether the current build key has already been loaded (or attempted) */
  const jaCarregouBuildAtual = useCallback(
    () => comboPreviewLoadedKeyRef.current === comboPreviewBuildKey,
    [comboPreviewBuildKey],
  );

  /** Reset all combo preview state (used by descartarDraft) */
  const resetComboPreview = useCallback(() => {
    setComboPreviewData(null);
    setComboPreviewErro(null);
    setComboPreviewTentativa(0);
    comboPreviewLoadedKeyRef.current = null;
  }, []);

  return {
    comboPreviewData, comboPreviewLoading, comboPreviewErro,
    comboPreviewTentativa, comboPreviewBuildKey,
    podeGerarPreview, carregarComboPreview,
    regenerarComboPreview, recarregarComboPreview,
    flattenComboPreview,
    resetComboPreview,
    jaCarregouBuildAtual,
  };
};

export type ComboPreviewApi = ReturnType<typeof useComboPreview>;
