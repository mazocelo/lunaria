import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { desvantagemService } from '../../../services/index';
import {
  formatBonusDisplay,
  formatObjectDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';
import type { VantagemDesvantagem } from '../../../types/api';

export interface DesvantagemNormalizada {
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
 * Tudo que diz respeito aos DADOS da desvantagem vive aqui.
 */
export const useDesvantagemVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<VantagemDesvantagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    desvantagemService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const desvantagem: DesvantagemNormalizada | null = raw ? normalizarDesvantagem(raw) : null;

  return { id, desvantagem, loading, error, setError, recarregar: carregar };
};

function normalizarDesvantagem(d: VantagemDesvantagem): DesvantagemNormalizada {
  return {
    id: d.id,
    nome: d.nome,
    descricao: d.descricao ?? null,
    imagem: d.imagem ?? null,
    custo: d.custo,
    nivel: d.nivel ?? 1,

    tipos: Array.isArray(d.tipo) ? d.tipo : [],
    elementos: Array.isArray(d.elemento) ? d.elemento : [],

    efeito: formatObjectDisplay(d.efeito),
    restricao: formatObjectDisplay(d.restricao),
    requisitos: formatRequisitosDisplay(d.requisitos),
    bonus: formatBonusDisplay(d.bonus),

    danoBase: d.dano_base || null,
    usar: d.usar || null,
  };
}
