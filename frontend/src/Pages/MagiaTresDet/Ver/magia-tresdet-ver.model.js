import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { magiasTresDetService } from '../../../services/index.js';
import { formatObjectDisplay } from '../../../components/shared';

export const useMagiaTresDetVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    magiasTresDetService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const magia = raw ? normalizarMagia(raw) : null;

  return { id, magia, loading, error, setError, recarregar: carregar };
};

function normalizarMagia(m) {
  return {
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,

    escola: m.escola,
    custoPm: m.custo_pm,
    alcance: m.alcance,
    duracao: m.duracao,
    tipo: m.tipo,
    exigencias: m.exigencias,
    nivelMinimo: m.nivel_minimo,

    focusRequisito: formatObjectDisplay(m.focus_requisito),
    efeito: formatObjectDisplay(m.efeito),
  };
}
