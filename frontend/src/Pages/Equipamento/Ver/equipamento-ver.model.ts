import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { equipamentoService } from '../../../services/index';
import { formatBonusDisplay, formatRequisitosDisplay } from '../../../components/shared';
import type { Equipamento } from '../Lista/equipamento-lista.model';

export interface EquipamentoNormalizado {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  numero: number | null;
  raridade: string;
  categoria: string | null;
  origemLore: string | null;
  vinculo: {
    requer: boolean | undefined;
    descricao: string | null;
    restricaoTipo: string | null;
    restricao: string[];
  } | null;
  tipos: string[];
  elementos: string[];
  propriedades: string[];
  danoBase: string | null;
  bonus: string[] | null;
  requisitos: string[] | null;
  cargas: number | null;
  usosPorDia: number | null;
  peso: number | null;
  precoSugerido: string | null;
}

export const useEquipamentoVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<Equipamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    equipamentoService.getById(Number(id))
      .then(res => setRaw(res.data as Equipamento))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const equipamento: EquipamentoNormalizado | null = raw ? normalizarEquipamento(raw) : null;

  return { id, equipamento, loading, error, setError, recarregar: carregar };
};

function normalizarEquipamento(eq: Equipamento): EquipamentoNormalizado {
  return {
    id: eq.id,
    nome: eq.nome,
    descricao: eq.descricao ?? null,
    imagem: eq.imagem ?? null,
    numero: eq.numero ?? null,

    raridade: eq.raridade_rel?.nome || 'Comum',
    categoria: eq.categoria_rel?.nome || null,

    origemLore: eq.origem_lore ?? null,

    vinculo: eq.vinculo ? {
      requer: eq.vinculo.requer,
      descricao: eq.vinculo.descricao ?? null,
      restricaoTipo: eq.vinculo.restricao_tipo
        ? eq.vinculo.restricao_tipo.charAt(0).toUpperCase() + eq.vinculo.restricao_tipo.slice(1)
        : null,
      restricao: Array.isArray(eq.vinculo.restricao) ? eq.vinculo.restricao : [],
    } : null,

    tipos: Array.isArray(eq.tipo) ? eq.tipo : [],
    elementos: Array.isArray(eq.elemento) ? eq.elemento : [],
    propriedades: Array.isArray(eq.propriedades) ? eq.propriedades : [],

    danoBase: eq.dano_base ?? null,

    bonus: formatBonusDisplay(eq.bonus),
    requisitos: formatRequisitosDisplay(eq.requisitos),

    cargas: eq.cargas ?? null,
    usosPorDia: eq.usos_por_dia ?? null,
    peso: eq.peso ?? null,
    precoSugerido: eq.preco_sugerido ?? null,
  };
}
