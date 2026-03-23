import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { itemTresDetService } from '../../../services/index.js';

export const useItemTresDetVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    itemTresDetService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const item = raw ? normalizarItem(raw) : null;

  return { id, item, loading, error, setError, recarregar: carregar };
};

function normalizarItem(raw) {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao,
    imagem: raw.imagem,
    tipo: raw.tipo,
    custoPe: raw.custo_pe ?? 0,
    precoMoedas: raw.preco_moedas ?? 0,
    poderes: raw.poderes,
    efeito: raw.efeito,
    empilhavel: raw.empilhavel ?? false,
    raridade: raw.raridade || 'comum',
    magiaVinculada: raw.magia_vinculada,
  };
}
