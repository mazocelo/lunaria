import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { desvantagemService } from '../../../services/index.js';
import {
  formatBonusDisplay,
  formatObjectDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da desvantagem vive aqui.
 */
export const useDesvantagemVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    desvantagemService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const desvantagem = raw ? normalizarDesvantagem(raw) : null;

  return { id, desvantagem, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarDesvantagem(d) {
  return {
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    imagem: d.imagem,
    custo: d.custo,
    nivel: d.nivel,

    // Arrays normalizados (nunca undefined)
    tipos: Array.isArray(d.tipo) ? d.tipo : [],
    elementos: Array.isArray(d.elemento) ? d.elemento : [],

    // Campos formatados
    efeito: formatObjectDisplay(d.efeito),
    restricao: formatObjectDisplay(d.restricao),
    requisitos: formatRequisitosDisplay(d.requisitos),
    bonus: formatBonusDisplay(d.bonus),

    // Combate / uso
    danoBase: d.dano_base || null,
    usar: d.usar || null,
  };
}
