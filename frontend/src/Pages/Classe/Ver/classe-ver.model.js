import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { classeService } from '../../../services/index.js';
import { formatBonusDisplay } from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da classe vive aqui.
 */
export const useClasseVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    classeService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const classe = raw ? normalizarClasse(raw) : null;

  return { id, classe, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve bonus, converte campos, trata defaults.
 */
function normalizarClasse(c) {
  return {
    id: c.id,
    nome: c.nome,
    descricao: c.descricao,
    imagem: c.imagem,
    custo: c.custo ?? 0,
    bonus: formatBonusDisplay(c.bonus),
  };
}
