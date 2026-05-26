import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { habilidadeService } from '../../../services/index';
import { formatObjectDisplay } from '../../../components/shared';

export interface ReceitaIngrediente {
  nome: string;
  quantidade: number;
}

export interface ReceitaFerramenta {
  nome: string;
}

export interface Receita {
  nome?: string;
  nivelRequerido?: number;
  tempo?: string | number;
  dificuldade?: number;
  descricao?: string;
  ingredientes: ReceitaIngrediente[];
  ferramentas: ReceitaFerramenta[];
}

export interface HabilidadeNormalizada {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  categoria: string;
  tipo: string;
  elemento: string | null;
  usaConcentracao: boolean;
  nivelRequerido: number;
  custoMana: number;
  danoBase: string | null;
  alvo: string;
  alcance: string;
  tempoConjuracao: string;
  cooldownTurnos: number;
  usosPorDescanso: number | null;
  escolaMagia: string | null;
  savingThrow: string | null;
  classeNome: string | null;
  racaNome: string | null;
  areaEfeito: string[] | null;
  componenteMaterial: string[] | null;
  preRequisitoItems: string[] | null;
  efeito: string[] | null;
  escalamento: string[] | null;
  receitas: Receita[];
}

interface RawReceitaIngrediente {
  ingrediente?: { nome?: string };
  nome?: string;
  quantidade?: number;
}

interface RawReceitaFerramenta {
  ferramenta?: { nome?: string };
  nome?: string;
}

interface RawReceita {
  nome?: string;
  nivel_requerido?: number;
  tempo?: string | number;
  dificuldade?: number;
  descricao?: string;
  ingredientes_rel?: RawReceitaIngrediente[];
  ferramentas_rel?: RawReceitaFerramenta[];
}

interface RawHabilidade {
  id: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  categoria?: string;
  tipo?: string;
  elemento?: string | null;
  usa_concentracao?: boolean;
  nivel_requerido?: number;
  custo_mana?: number;
  dano_base?: string | null;
  alvo?: string;
  alcance?: string;
  tempo_conjuracao?: string;
  cooldown_turnos?: number;
  usos_por_descanso?: number | null;
  escola_magia?: string | null;
  saving_throw?: string | null;
  classe?: { nome?: string };
  raca?: { nome?: string };
  area_efeito?: unknown;
  componente_material?: unknown;
  pre_requisitos?: unknown;
  pre_requisito?: unknown;
  efeito?: unknown;
  escalamento?: unknown;
  receitas?: RawReceita[];
}

export const useHabilidadeVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<RawHabilidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    habilidadeService.getById(Number(id))
      .then(res => setRaw(res.data as RawHabilidade))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const habilidade: HabilidadeNormalizada | null = raw ? normalizarHabilidade(raw) : null;

  return { id, habilidade, loading, error, setError, recarregar: carregar };
};

function normalizarHabilidade(h: RawHabilidade): HabilidadeNormalizada {
  return {
    id: h.id,
    nome: h.nome,
    descricao: h.descricao ?? null,
    imagem: h.imagem ?? null,

    categoria: h.categoria ?? '',
    tipo: h.tipo ?? '',
    elemento: h.elemento ?? null,
    usaConcentracao: h.usa_concentracao ?? false,

    nivelRequerido: h.nivel_requerido ?? 1,
    custoMana: h.custo_mana ?? 0,
    danoBase: h.dano_base ?? null,

    alvo: h.alvo ?? '',
    alcance: h.alcance ?? '',
    tempoConjuracao: h.tempo_conjuracao ?? '',

    cooldownTurnos: h.cooldown_turnos ?? 0,
    usosPorDescanso: h.usos_por_descanso ?? null,

    escolaMagia: h.escola_magia ?? null,
    savingThrow: h.saving_throw ?? null,

    classeNome: h.classe?.nome ?? null,
    racaNome: h.raca?.nome ?? null,

    areaEfeito: formatObjectDisplay(h.area_efeito),
    componenteMaterial: formatObjectDisplay(h.componente_material),
    preRequisitoItems: formatObjectDisplay(h.pre_requisitos ?? h.pre_requisito),
    efeito: formatObjectDisplay(h.efeito),
    escalamento: formatObjectDisplay(h.escalamento),

    receitas: Array.isArray(h.receitas) ? h.receitas.map(r => ({
      nome: r.nome,
      nivelRequerido: r.nivel_requerido,
      tempo: r.tempo,
      dificuldade: r.dificuldade,
      descricao: r.descricao,
      ingredientes: (r.ingredientes_rel || []).map(ri => ({
        nome: ri.ingrediente?.nome || ri.nome || '?',
        quantidade: ri.quantidade || 1,
      })),
      ferramentas: (r.ferramentas_rel || []).map(rf => ({
        nome: rf.ferramenta?.nome || rf.nome || '?',
      })),
    })) : [],
  };
}
