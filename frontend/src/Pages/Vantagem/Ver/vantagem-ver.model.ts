import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { vantagemService } from '../../../services/index';
import {
  formatBonusDisplay,
  formatObjectDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';
import type { VantagemDesvantagem } from '../../../types/api';

export interface VantagemNormalizada {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  custo: number;
  nivel: number;
  tipos: string[];
  elementos: string[];
  efeito: string[] | null;
  restricao: string[] | null;
  requisitos: string[] | null;
  bonus: string[] | null;
  danoBase: string | null;
  usar: number | null;
}

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da vantagem vive aqui.
 */
export const useVantagemVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<VantagemDesvantagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    vantagemService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const vantagem: VantagemNormalizada | null = raw ? normalizarVantagem(raw) : null;

  return { id, vantagem, loading, error, setError, recarregar: carregar };
};

function normalizarVantagem(v: VantagemDesvantagem): VantagemNormalizada {
  return {
    id: v.id,
    nome: v.nome,
    descricao: v.descricao ?? null,
    imagem: v.imagem ?? null,
    custo: v.custo,
    nivel: v.nivel ?? 1,

    tipos: Array.isArray(v.tipo) ? v.tipo : [],
    elementos: Array.isArray(v.elemento) ? v.elemento : [],

    efeito: formatObjectDisplay(v.efeito),
    restricao: formatObjectDisplay(v.restricao),
    requisitos: formatRequisitosDisplay(v.requisitos),
    bonus: formatBonusDisplay(v.bonus),

    danoBase: v.dano_base || null,
    usar: v.usar || null,
  };
}
