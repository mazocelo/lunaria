import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { racaService } from '../../../services/index.js';
import { formatBonusDisplay } from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da raca vive aqui.
 */
export const useRacaVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    racaService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const raca = raw ? normalizarRaca(raw) : null;

  return { id, raca, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve bonus, converte campos, trata defaults.
 */
function normalizarRaca(r) {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    imagem: r.imagem,
    custo: r.custo ?? 0,
    bonus: formatBonusDisplay(r.bonus),
  };
}
