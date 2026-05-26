import { useState, useEffect, useMemo, useRef } from 'react';
import { useMestreStore } from '../../../store/mestre';
import { apiClient, mestreService } from '../../../services/index';
import type { MestreItem } from '../../../store/mestre/states';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useMestreListaModel = () => {
  const mestres = useMestreStore(s => s.mestresAtivos);
  const loading = useMestreStore(s => s.loading);
  const error = useMestreStore(s => s.error);
  const mestresCarregados = useMestreStore(s => s.mestresCarregados);
  const carregarMestres = useMestreStore(s => s.carregarMestres);
  const recarregarMestres = useMestreStore(s => s.recarregarMestres);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mestreToDelete, setMestreToDelete] = useState<MestreItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [playingMestreId, setPlayingMestreId] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mestresCarregados) carregarMestres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      (m.nome as string | undefined)?.toLowerCase().includes(term) ||
      (m.modelo as string | undefined)?.toLowerCase().includes(term) ||
      (m.tom_narrativo as string | undefined)?.toLowerCase().includes(term) ||
      (Array.isArray(m.tags) && m.tags.some((tag) => String(tag).toLowerCase().includes(term)))
    );
  }, [mestres, searchTerm]);

  const deleteMestre = async (id: number) => {
    try {
      await mestreService.delete(id);
      await recarregarMestres();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLocalError(`Erro ao deletar mestre: ${message}`);
      return { success: false };
    }
  };

  const handleDeleteClick = (mestre: MestreItem) => {
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

  const handlePreviewVoz = async (mestre: MestreItem) => {
    const voiceId = mestre.voice_id as string | undefined;
    if (!voiceId || previewLoading) return;

    if (playingMestreId && String(playingMestreId) === String(mestre.id)) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewLoading(true);
    try {
      const body = {
        voiceId,
        provider: (mestre.voice_provider as string | undefined) || DEFAULT_TTS_PROVIDER,
      };
      const response = await apiClient.post('/tts/preview', body, { responseType: 'blob' });
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewUrlRef.current = url;
      previewAudioRef.current = audio;
      audio.onended = () => stopPreview();
      audio.onpause = () => setPlayingMestreId(null);
      await audio.play();
      setPlayingMestreId(mestre.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('TTS preview error:', message);
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
  };
};
