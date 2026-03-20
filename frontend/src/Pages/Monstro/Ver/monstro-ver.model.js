import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { monstroService } from '../../../services/index.js';

/**
 * Model puro: estado + sincronizacao.
 * Sem logica de negocio, sem tema, sem navegacao.
 */
export const useMonstroVerModel = () => {
  const { id } = useParams();
  const [monstro, setMonstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    monstroService.getById(id)
      .then(res => setMonstro(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return {
    monstro,
    loading,
    error,
    setError,
  };
};
