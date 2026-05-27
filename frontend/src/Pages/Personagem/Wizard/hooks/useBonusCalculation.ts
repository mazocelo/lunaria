import { useState, useMemo, useCallback } from 'react';
import { BONUS_ATTR_KEYS, parseRacaClasseBonus, somarBonusAtributos } from '../../../../utils/personagemBonus';
import type { WizardDraft } from './useDraftPersistence';

const PONTOS_TOTAIS = 60;
const ATTR_MIN = 5;
const ATTR_MAX = 16;

const ATRIBUTOS_INICIAIS: Record<string, number> = {
  forca: 10,
  destreza: 10,
  constituicao: 10,
  inteligencia: 10,
  agilidade: 10,
  carisma: 10,
};

interface CatalogoItem {
  id?: number | string;
  nome?: string;
  bonus?: unknown;
}

interface BonusFonte {
  label: string;
  valor: number;
}

interface NormalizacaoResultado {
  applied: boolean;
  reason?: string;
  atributos?: Record<string, number>;
}

interface UseBonusCalculationParams {
  draftInicial?: WizardDraft | null;
  racaId?: number | string | null;
  classeId?: number | string | null;
  vantagensIds: Array<number | string>;
  desvantagensIds: Array<number | string>;
  racasDisponiveis?: CatalogoItem[];
  classesDisponiveis?: CatalogoItem[];
  vantagensDisponiveis?: CatalogoItem[];
}

function somaAtributos(atributos: Record<string, number | string>): number {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

function normalizarAtributosSugeridos(raw: unknown): NormalizacaoResultado {
  if (!raw || typeof raw !== 'object') {
    return { applied: false, reason: 'Sugestao ausente ou invalida.' };
  }

  const rawObj = raw as Record<string, unknown>;
  const normalizados: Record<string, number> = {};
  for (const key of BONUS_ATTR_KEYS) {
    const value = Number(rawObj[key]);
    if (!Number.isFinite(value)) {
      return { applied: false, reason: `Sugestao invalida para ${key}.` };
    }
    normalizados[key] = Math.min(ATTR_MAX, Math.max(ATTR_MIN, Math.trunc(value)));
  }

  const soma = somaAtributos(normalizados);
  if (soma !== PONTOS_TOTAIS) {
    return { applied: false, reason: `A sugestao precisa somar ${PONTOS_TOTAIS} pontos.` };
  }

  return { applied: true, atributos: normalizados };
}

/**
 * Gerencia calculo de bonus e atributos.
 * Responsabilidades: atributosBase, bonusDetalhes, atributosFinal, confirmacao.
 */
export const useBonusCalculation = ({
  draftInicial,
  racaId,
  classeId,
  vantagensIds,
  desvantagensIds,
  racasDisponiveis,
  classesDisponiveis,
  vantagensDisponiveis,
}: UseBonusCalculationParams) => {
  const [atributosBase, setAtributosBase] = useState<Record<string, number>>(
    draftInicial?.atributosBase || { ...ATRIBUTOS_INICIAIS }
  );

  const [bonusAplicados, setBonusAplicados] = useState<boolean>(draftInicial?.bonusAplicados || false);
  const [bonusInvalidado, setBonusInvalidado] = useState(false);
  const [atributosSugeridos, setAtributosSugeridos] = useState<unknown>(null);

  const { bonusDetalhes, bonusFontes } = useMemo(() => {
    const racaObj = (racasDisponiveis || []).find((r) => String(r.id) === String(racaId));
    const classeObj = (classesDisponiveis || []).find((c) => String(c.id) === String(classeId));
    const racaBonus = parseRacaClasseBonus(racaObj?.bonus) || {};
    const classeBonus = parseRacaClasseBonus(classeObj?.bonus) || {};

    const allItems = vantagensDisponiveis || [];
    const selectedIds = new Set([...vantagensIds, ...desvantagensIds].map((id) => String(id)));
    const tracosSelecionados = allItems.filter((item) => selectedIds.has(String(item.id)));
    const tracosBonus = somarBonusAtributos(tracosSelecionados);

    const detalhes: Record<string, number> = {};
    const fontes: Record<string, BonusFonte[]> = {};

    for (const key of BONUS_ATTR_KEYS) {
      const rVal = Number(racaBonus[key]) || 0;
      const cVal = Number(classeBonus[key]) || 0;
      const tVal = Number(tracosBonus[key]) || 0;
      const total = rVal + cVal + tVal;
      if (total !== 0) detalhes[key] = total;

      const keyFontes: BonusFonte[] = [];
      if (rVal !== 0) keyFontes.push({ label: racaObj?.nome || 'Raça', valor: rVal });
      if (cVal !== 0) keyFontes.push({ label: classeObj?.nome || 'Classe', valor: cVal });

      // Per-trait breakdown
      for (const traco of tracosSelecionados) {
        const tracoB = parseRacaClasseBonus(traco?.bonus) || {};
        const v = Number(tracoB[key]) || 0;
        if (v !== 0) keyFontes.push({ label: traco.nome || 'Traço', valor: v });
      }

      if (keyFontes.length > 0) fontes[key] = keyFontes;
    }

    return { bonusDetalhes: detalhes, bonusFontes: fontes };
  }, [racaId, classeId, vantagensIds, desvantagensIds, racasDisponiveis, classesDisponiveis, vantagensDisponiveis]);

  const atributosFinal = useMemo(() => {
    const result: Record<string, number> = { ...atributosBase };
    for (const [key, val] of Object.entries(bonusDetalhes)) {
      result[key] = (result[key] || 10) + val;
    }
    return result;
  }, [atributosBase, bonusDetalhes]);

  const somaAtual = useMemo(() => somaAtributos(atributosBase), [atributosBase]);
  const pontosDistribuidos = somaAtual;
  const pontosRestantes = PONTOS_TOTAIS - somaAtual;

  const confirmarAtributos = useCallback(() => {
    if (bonusAplicados || pontosRestantes !== 0) return;
    setBonusAplicados(true);
    setBonusInvalidado(false);
  }, [bonusAplicados, pontosRestantes]);

  const setAtributo = useCallback((key: string, value: number | string) => {
    if (!(BONUS_ATTR_KEYS as readonly string[]).includes(key)) return;
    const val = Math.min(ATTR_MAX, Math.max(ATTR_MIN, Number(value) || ATTR_MIN));
    setAtributosBase((prev) => ({ ...prev, [key]: val }));
  }, []);

  const aplicarAtributosSugeridos = useCallback((): NormalizacaoResultado => {
    const resultado = normalizarAtributosSugeridos(atributosSugeridos);
    if (!resultado.applied || !resultado.atributos) return resultado;
    setAtributosBase(resultado.atributos);
    return { applied: true };
  }, [atributosSugeridos]);

  const resetarAtributos = useCallback(() => {
    setAtributosBase({ ...ATRIBUTOS_INICIAIS });
    setBonusAplicados(false);
    setBonusInvalidado(false);
    setAtributosSugeridos(null);
  }, []);

  return {
    atributosBase,
    atributosFinal,
    bonusDetalhes,
    bonusFontes,
    bonusAplicados,
    bonusInvalidado,
    atributosSugeridos,
    setAtributosSugeridos,
    pontosDistribuidos,
    pontosRestantes,
    pontosTotais: PONTOS_TOTAIS,
    attrMin: ATTR_MIN,
    attrMax: ATTR_MAX,
    confirmarAtributos,
    setAtributo,
    aplicarAtributosSugeridos,
    resetarAtributos,
    setBonusAplicados,
    setBonusInvalidado,
  };
};

export type BonusCalculationApi = ReturnType<typeof useBonusCalculation>;
