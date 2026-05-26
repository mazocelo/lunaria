import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { itemTresDetService } from '../../../services/index';

export interface ItemTresDetNormalizado {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  tipo: string;
  custoPe: number;
  precoMoedas: number;
  poderes: unknown;
  efeito: string | null;
  empilhavel: boolean;
  raridade: string;
  magiaVinculada: string | null;
}

interface RawItemTresDet {
  id: number;
  nome?: string;
  descricao?: string | null;
  imagem?: string | null;
  tipo?: string;
  custo_pe?: number;
  preco_moedas?: number;
  poderes?: unknown;
  efeito?: string | null;
  empilhavel?: boolean;
  raridade?: string;
  magia_vinculada?: string | null;
}

export const useItemTresDetVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<RawItemTresDet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    itemTresDetService.getById(Number(id))
      .then(res => setRaw(res.data as RawItemTresDet))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const item: ItemTresDetNormalizado | null = raw ? normalizarItem(raw) : null;

  return { id, item, loading, error, setError, recarregar: carregar };
};

function normalizarItem(raw: RawItemTresDet): ItemTresDetNormalizado {
  return {
    id: raw.id,
    nome: raw.nome ?? '',
    descricao: raw.descricao ?? null,
    imagem: raw.imagem ?? null,
    tipo: raw.tipo ?? '',
    custoPe: raw.custo_pe ?? 0,
    precoMoedas: raw.preco_moedas ?? 0,
    poderes: raw.poderes,
    efeito: raw.efeito ?? null,
    empilhavel: raw.empilhavel ?? false,
    raridade: raw.raridade || 'comum',
    magiaVinculada: raw.magia_vinculada ?? null,
  };
}
