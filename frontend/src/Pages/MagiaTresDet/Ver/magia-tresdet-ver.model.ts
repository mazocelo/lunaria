import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { magiasTresDetService } from '../../../services/index';
import { formatObjectDisplay } from '../../../components/shared';
import type { MagiaTresdet } from '../../../types/api';

export interface MagiaTresDetNormalizada {
  id: number;
  nome: string;
  descricao: string;
  escola: string;
  escolaLabel: string;
  escolaColor: string;
  custoPm: string;
  alcance: string;
  duracao: string;
  tipo: string;
  exigencias: string | null;
  nivelMinimo: number;
  focusRequisito: string[] | null;
  efeito: string[] | null;
}

const ESCOLA_CONFIG: Record<string, { label: string; color: string }> = {
  branca: { label: 'Branca', color: '#f59e0b' },
  negra: { label: 'Negra', color: '#8b5cf6' },
  elemental: { label: 'Elemental', color: '#ef4444' },
};
const ESCOLA_COR_PADRAO = '#8b5cf6';

function capitalizar(valor: string): string {
  return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : '';
}

export const useMagiaTresDetVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<MagiaTresdet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    magiasTresDetService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const magia: MagiaTresDetNormalizada | null = raw ? normalizarMagia(raw) : null;

  return { id, magia, loading, error, setError, recarregar: carregar };
};

function normalizarMagia(m: MagiaTresdet): MagiaTresDetNormalizada {
  const escola = (m.escola || '').toLowerCase().trim();
  const config = ESCOLA_CONFIG[escola];
  return {
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    escola,
    escolaLabel: config?.label || capitalizar(escola) || '—',
    escolaColor: config?.color || ESCOLA_COR_PADRAO,
    custoPm: m.custo_pm,
    alcance: m.alcance,
    duracao: m.duracao,
    tipo: m.tipo,
    exigencias: m.exigencias ?? null,
    nivelMinimo: m.nivel_minimo ?? 1,
    focusRequisito: formatObjectDisplay(m.focus_requisito),
    efeito: formatObjectDisplay(m.efeito),
  };
}
