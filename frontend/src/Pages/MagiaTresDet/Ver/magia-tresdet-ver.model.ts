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
  custoPm: string;
  alcance: string;
  duracao: string;
  tipo: string;
  exigencias: string | null;
  nivelMinimo: number;
  focusRequisito: string[] | null;
  efeito: string[] | null;
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
  return {
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    escola: m.escola,
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
