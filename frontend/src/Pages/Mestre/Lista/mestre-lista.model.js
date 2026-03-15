import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMestreStore } from '../../../store/mestre';
import { apiClient, mestreService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../constants/routes.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useMestreListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const mestres = useMestreStore(s => s.mestresAtivos);
  const loading = useMestreStore(s => s.loading);
  const error = useMestreStore(s => s.error);
  const mestresCarregados = useMestreStore(s => s.mestresCarregados);
  const carregarMestres = useMestreStore(s => s.carregarMestres);
  const recarregarMestres = useMestreStore(s => s.recarregarMestres);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mestreToDelete, setMestreToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [playingMestreId, setPlayingMestreId] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewAudioRef = useRef(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    if (!mestresCarregados) carregarMestres();
  }, []);

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPlayingMestreId(null);
  };

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const filteredMestres = useMemo(() => {
    if (!searchTerm) return mestres;
    const term = searchTerm.toLowerCase();
    return mestres.filter(m =>
      m.nome?.toLowerCase().includes(term) ||
      m.modelo?.toLowerCase().includes(term) ||
      m.tom_narrativo?.toLowerCase().includes(term) ||
      (Array.isArray(m.tags) && m.tags.some((tag) => String(tag).toLowerCase().includes(term)))
    );
  }, [mestres, searchTerm]);

  const deleteMestre = async (id) => {
    try {
      await mestreService.delete(id);
      await recarregarMestres();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao deletar mestre: ${err.message}`);
      return { success: false };
    }
  };

  const handleDeleteClick = (mestre) => {
    setMestreToDelete(mestre);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!mestreToDelete) return;
    setDeleteLoading(true);
    const result = await deleteMestre(mestreToDelete.id);
    if (result.success) {
      setShowDeleteModal(false);
      setMestreToDelete(null);
    }
    setDeleteLoading(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMestreToDelete(null);
    setDeleteLoading(false);
  };

  const handlePreviewVoz = async (mestre) => {
    if (!mestre?.voice_id || previewLoading) return;

    if (playingMestreId && String(playingMestreId) === String(mestre.id)) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewLoading(true);
    try {
      const body = {
        voiceId: mestre.voice_id,
        provider: mestre.voice_provider || DEFAULT_TTS_PROVIDER,
      };
      const response = await apiClient.post('/tts/preview', body, { responseType: 'blob' });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewUrlRef.current = url;
      previewAudioRef.current = audio;
      audio.onended = () => stopPreview();
      audio.onpause = () => setPlayingMestreId(null);
      await audio.play();
      setPlayingMestreId(mestre.id);
    } catch (err) {
      console.error('TTS preview error:', err.message);
      stopPreview();
    } finally {
      setPreviewLoading(false);
    }
  };

  const clearError = () => {
    setLocalError(null);
    useMestreStore.setState({ error: null });
  };

  return {
    mestres,
    filteredMestres,
    loading,
    error: localError || error,
    isLight,
    showDeleteModal,
    mestreToDelete,
    deleteLoading,
    buscarMestres: setSearchTerm,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handlePreviewVoz,
    playingMestreId,
    clearError,
    navigate,
    generateRoute,
  };
};
