import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../../../../services/index.js';

export const useGrimorio = ({ racaId, racasDisponiveis }) => {
  const [magias, setMagias] = useState([]);
  const [slots, setSlots] = useState(0);
  const [selecionadas, setSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [error, setError] = useState(null);
  const [grimorioSelecionado, setGrimorioSelecionado] = useState(false);

  const loadedClasseRef = useRef(null);

  const racaPodeMagia = (() => {
    if (!racaId || !racasDisponiveis?.length) return true;
    const raca = racasDisponiveis.find(r => String(r.id) === String(racaId));
    return raca?.pode_magia !== false;
  })();

  const carregarGrimorio = useCallback(async (classeId) => {
    if (!classeId) return;
    if (loadedClasseRef.current === classeId) return;

    setLoading(true);
    setError(null);

    try {
      const [slotsRes, magiasRes] = await Promise.all([
        apiClient.get(`/habilidades-magias/slots?classe_id=${classeId}&nivel=1`),
        apiClient.get(`/habilidades-magias/disponiveis?classe_id=${classeId}&nivel=1`),
      ]);

      const slotsCount = slotsRes.slots || 0;
      setSlots(slotsCount);
      setMagias(Array.isArray(magiasRes) ? magiasRes : []);
      loadedClasseRef.current = classeId;

      // Auto-mark done if no slots or no magic capability
      if (slotsCount === 0 || !racaPodeMagia) {
        setGrimorioSelecionado(true);
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar grimorio');
      setSlots(0);
      setMagias([]);
    } finally {
      setLoading(false);
      setCarregado(true);
    }
  }, [racaPodeMagia]);

  const toggleMagia = useCallback((magiaId) => {
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
    resetGrimorio,
    devePularGrimorio: !racaPodeMagia,
    racaPodeMagia,
  };
};
