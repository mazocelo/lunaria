import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { monstroService } from '../../../services/index';
import { formatJson } from '../../../components/shared';
import type { Monstro } from '../../../types/api';

export interface MonstroHabilidadeNormalizada {
  nome: string | null;
  descricao: string | null;
  dano: string | null;
}

export interface MonstroNormalizado {
  id: number;
  nome: string;
  imagem: string | null;
  descricao: string | null;
  raridade: string;
  categoria: string | null;
  nivelMin: number;
  nivelMax: number;
  atributos: {
    forca: number;
    inteligencia: number;
    destreza: number;
    constituicao: number;
    agilidade: number;
    carisma: number;
  };
  combate: {
    hpBase: number;
    ataqueBase: number;
    defesaBase: number;
    danoBase: string | null;
    xpBase: number;
  };
  tipos: string[];
  elementos: string[];
  temas: number[];
  habilidades: MonstroHabilidadeNormalizada[] | null;
}

export const useMonstroVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<Monstro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    monstroService.getById(Number(id))
      .then(res => setRaw(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const monstro: MonstroNormalizado | null = raw ? normalizarMonstro(raw) : null;

  return { id, monstro, loading, error, setError, recarregar: carregar };
};

function normalizarMonstro(m: Monstro): MonstroNormalizado {
  const habilidadesRaw = formatJson(m.habilidades);
  const ext = m as unknown as Record<string, unknown>;

  return {
    id: m.id,
    nome: m.nome,
    imagem: m.imagem ?? null,
    descricao: m.descricao ?? null,

    raridade: m.raridade_rel?.nome || 'Comum',
    categoria: m.categoria_rel?.nome || null,

    nivelMin: m.nivel_min,
    nivelMax: m.nivel_max,

    atributos: {
      forca: (ext.forca as number) || 0,
      inteligencia: (ext.inteligencia as number) || 0,
      destreza: (ext.destreza as number) || 0,
      constituicao: (ext.constituicao as number) || 0,
      agilidade: (ext.agilidade as number) || 0,
      carisma: (ext.carisma as number) || 0,
    },

    combate: {
      hpBase: m.hp_base,
      ataqueBase: m.ataque_base,
      defesaBase: m.defesa_base,
      danoBase: m.dano_base || null,
      xpBase: m.xp_base,
    },

    tipos: Array.isArray(m.tipo) ? m.tipo : [],
    elementos: Array.isArray(m.elemento) ? m.elemento : [],
    temas: Array.isArray(m.temas) ? m.temas : [],

    habilidades: normalizarHabilidades(habilidadesRaw),
  };
}

function normalizarHabilidades(hab: unknown): MonstroHabilidadeNormalizada[] | null {
  if (!hab) return null;
  if (Array.isArray(hab)) {
    return hab.map((h): MonstroHabilidadeNormalizada => {
      if (h && typeof h === 'object') {
        const obj = h as Record<string, unknown>;
        return {
          nome: (obj.nome as string) || null,
          descricao: (obj.descricao as string) || null,
          dano: (obj.dano as string) || null,
        };
      }
      return { nome: null, descricao: String(h), dano: null };
    });
  }
  if (typeof hab === 'object') {
    return Object.entries(hab as Record<string, unknown>).map(([k, v]) => ({
      nome: k,
      descricao: typeof v === 'object' ? JSON.stringify(v) : String(v),
      dano: null,
    }));
  }
  return [{ nome: null, descricao: String(hab), dano: null }];
}
