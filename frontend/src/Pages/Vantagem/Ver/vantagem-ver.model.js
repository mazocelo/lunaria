import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { vantagemService } from '../../../services/index.js';
import {
  formatBonusDisplay,
  formatObjectDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da vantagem vive aqui.
 */
export const useVantagemVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    vantagemService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const vantagem = raw ? normalizarVantagem(raw) : null;

  return { id, vantagem, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarVantagem(v) {
  return {
    id: v.id,
    nome: v.nome,
    descricao: v.descricao,
    imagem: v.imagem,
    custo: v.custo,
    nivel: v.nivel,

    // Arrays normalizados (nunca undefined)
    tipos: Array.isArray(v.tipo) ? v.tipo : [],
    elementos: Array.isArray(v.elemento) ? v.elemento : [],

    // Campos formatados
    efeito: formatObjectDisplay(v.efeito),
    restricao: formatObjectDisplay(v.restricao),
    requisitos: formatRequisitosDisplay(v.requisitos),
    bonus: formatBonusDisplay(v.bonus),

    // Combate / uso
    danoBase: v.dano_base || null,
    usar: v.usar || null,
  };
}
