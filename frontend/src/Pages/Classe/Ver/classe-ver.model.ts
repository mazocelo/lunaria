import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { classeService } from '../../../services/index';
import { formatBonusDisplay } from '../../../components/shared';
import type { Classe } from '../../../types/api';

export interface ClasseNormalizada {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  custo: number;
  bonus: string[] | null;
}

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da classe vive aqui.
 */
export const useClasseVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    classeService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const classe: ClasseNormalizada | null = raw ? normalizarClasse(raw) : null;

  return { id, classe, loading, error, setError, recarregar: carregar };
};

function normalizarClasse(c: Classe): ClasseNormalizada {
  return {
    id: c.id,
    nome: c.nome,
    descricao: c.descricao ?? null,
    imagem: c.imagem ?? null,
    custo: c.custo ?? 0,
    bonus: formatBonusDisplay(c.bonus),
  };
}
