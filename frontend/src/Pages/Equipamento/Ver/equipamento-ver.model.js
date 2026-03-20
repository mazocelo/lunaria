import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { equipamentoService } from '../../../services/index.js';
import { formatBonusDisplay, formatRequisitosDisplay } from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS do equipamento vive aqui.
 */
export const useEquipamentoVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    equipamentoService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const equipamento = raw ? normalizarEquipamento(raw) : null;

  return { id, equipamento, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarEquipamento(eq) {
  return {
    id: eq.id,
    nome: eq.nome,
    descricao: eq.descricao,
    imagem: eq.imagem,
    numero: eq.numero,

    // Relacoes resolvidas (string only, View resolves visual config)
    raridade: eq.raridade_rel?.nome || 'Comum',
    categoria: eq.categoria_rel?.nome || null,

    // snake_case -> camelCase
    origemLore: eq.origem_lore,

    // Vinculo (keep structure as-is)
    vinculo: eq.vinculo || null,

    // Arrays normalizados (nunca undefined)
    tipos: Array.isArray(eq.tipo) ? eq.tipo : [],
    elementos: Array.isArray(eq.elemento) ? eq.elemento : [],
    propriedades: Array.isArray(eq.propriedades) ? eq.propriedades : [],

    // Combate
    danoBase: eq.dano_base || null,

    // Formatados para exibicao
    bonus: formatBonusDisplay(eq.bonus),
    requisitos: formatRequisitosDisplay(eq.requisitos),

    // Valores simples (snake_case -> camelCase)
    cargas: eq.cargas,
    usosPorDia: eq.usos_por_dia,
    peso: eq.peso,
    precoSugerido: eq.preco_sugerido,
  };
}
