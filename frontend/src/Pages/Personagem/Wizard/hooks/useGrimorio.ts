import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../../../../services/index';

interface RacaItem {
  id?: number | string;
  pode_magia?: boolean;
}

interface MagiaItem {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface UseGrimorioParams {
  racaId?: number | string | null;
  racasDisponiveis?: RacaItem[];
  /** Rascunho restaurado: magias escolhidas e se já foram confirmadas. */
  selecionadasIniciais?: Array<number | string>;
  confirmadoInicial?: boolean;
}

export const useGrimorio = ({ racaId, racasDisponiveis, selecionadasIniciais, confirmadoInicial = false }: UseGrimorioParams) => {
  const [magias, setMagias] = useState<MagiaItem[]>([]);
  const [slots, setSlots] = useState(0);
  const [selecionadas, setSelecionadas] = useState<string[]>(() => (selecionadasIniciais ?? []).map(String));
  const [loading, setLoading] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grimorioSelecionado, setGrimorioSelecionado] = useState(confirmadoInicial);

  const loadedClasseRef = useRef<number | string | null>(null);

  const racaPodeMagia = (() => {
    if (!racaId || !racasDisponiveis?.length) return true;
    const raca = racasDisponiveis.find(r => String(r.id) === String(racaId));
    return raca?.pode_magia !== false;
  })();

  const carregarGrimorio = useCallback(async (classeId: number | string) => {
    if (!classeId) return;
    if (loadedClasseRef.current === classeId) return;

    setLoading(true);
    setError(null);

    try {
      const [slotsRes, magiasRes] = await Promise.all([
        apiClient.get(`/habilidades-magias/slots?classe_id=${classeId}&nivel=1`) as Promise<{ slots?: number } | null>,
        apiClient.get(`/habilidades-magias/disponiveis?classe_id=${classeId}&nivel=1`) as Promise<MagiaItem[] | null>,
      ]);

      const slotsCount = slotsRes?.slots || 0;
      setSlots(slotsCount);
      setMagias(Array.isArray(magiasRes) ? magiasRes : []);
      loadedClasseRef.current = classeId;

      // Auto-mark done if no slots or no magic capability
      if (slotsCount === 0 || !racaPodeMagia) {
        setGrimorioSelecionado(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar grimorio';
      setError(message);
      setSlots(0);
      setMagias([]);
    } finally {
      setLoading(false);
      setCarregado(true);
    }
  }, [racaPodeMagia]);

  /** "Tentar de novo" depois de erro: força a carga mesmo para a classe já carregada (B13). */
  const recarregarGrimorio = useCallback((classeId: number | string) => {
    loadedClasseRef.current = null;
    void carregarGrimorio(classeId);
  }, [carregarGrimorio]);

  const toggleMagia = useCallback((magiaId: number | string) => {
    const id = String(magiaId);
    setSelecionadas(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= slots) return prev;
      return [...prev, id];
    });
  }, [slots]);

  const confirmarGrimorio = useCallback(() => {
    setGrimorioSelecionado(true);
  }, []);

  const resetGrimorio = useCallback(() => {
    setSelecionadas([]);
    setGrimorioSelecionado(false);
    setCarregado(false);
    loadedClasseRef.current = null;
  }, []);

  return {
    grimorioMagias: magias,
    grimorioSlots: slots,
    grimorioSelecionadas: selecionadas,
    grimorioLoading: loading,
    grimorioCarregado: carregado,
    grimorioError: error,
    grimorioSelecionado,
    toggleGrimorioMagia: toggleMagia,
    confirmarGrimorio,
    carregarGrimorio,
    recarregarGrimorio,
    resetGrimorio,
    devePularGrimorio: !racaPodeMagia,
    racaPodeMagia,
  };
};

export type GrimorioApi = ReturnType<typeof useGrimorio>;
