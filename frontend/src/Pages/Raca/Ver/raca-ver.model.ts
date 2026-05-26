import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { racaService } from '../../../services/index';
import { formatBonusDisplay } from '../../../components/shared';
import type { Raca } from '../../../types/api';

export interface RacaNormalizada {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  custo: number;
  bonus: string[] | null;
}

export const useRacaVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<Raca | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    racaService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const raca: RacaNormalizada | null = raw ? normalizarRaca(raw) : null;

  return { id, raca, loading, error, setError, recarregar: carregar };
};

function normalizarRaca(r: Raca): RacaNormalizada {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? null,
    imagem: r.imagem ?? null,
    custo: r.custo ?? 0,
    bonus: formatBonusDisplay(r.bonus),
  };
}
