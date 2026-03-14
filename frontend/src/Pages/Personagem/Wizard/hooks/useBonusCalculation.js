import { useState, useMemo, useCallback } from 'react';
import { BONUS_ATTR_KEYS, parseRacaClasseBonus, somarBonusAtributos } from '../../../../utils/personagemBonus.js';

const PONTOS_TOTAIS = 60;
const ATTR_MIN = 5;
const ATTR_MAX = 16;

const ATRIBUTOS_INICIAIS = {
  forca: 10,
  destreza: 10,
  constituicao: 10,
  inteligencia: 10,
  agilidade: 10,
  carisma: 10,
};

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

function normalizarAtributosSugeridos(raw) {
  if (!raw || typeof raw !== 'object') {
    return { applied: false, reason: 'Sugestao ausente ou invalida.' };
  }

  const normalizados = {};
  for (const key of BONUS_ATTR_KEYS) {
    const value = Number(raw[key]);
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
}) => {
  const [atributosBase, setAtributosBase] = useState(
    draftInicial?.atributosBase || { ...ATRIBUTOS_INICIAIS }
  );

  const [bonusAplicados, setBonusAplicados] = useState(draftInicial?.bonusAplicados || false);
  const [bonusInvalidado, setBonusInvalidado] = useState(false);
  const [atributosSugeridos, setAtributosSugeridos] = useState(null);

  const bonusDetalhes = useMemo(() => {
    const racaObj = (racasDisponiveis || []).find((r) => String(r.id) === String(racaId));
    const classeObj = (classesDisponiveis || []).find((c) => String(c.id) === String(classeId));
    const racaBonus = parseRacaClasseBonus(racaObj?.bonus) || {};
    const classeBonus = parseRacaClasseBonus(classeObj?.bonus) || {};

    const allItems = vantagensDisponiveis || [];
    const selectedIds = new Set([...vantagensIds, ...desvantagensIds].map((id) => String(id)));
    const tracosSelecionados = allItems.filter((item) => selectedIds.has(String(item.id)));
    const tracosBonus = somarBonusAtributos(tracosSelecionados);

    return BONUS_ATTR_KEYS.reduce((acc, key) => {
      const bonus = (Number(racaBonus[key]) || 0) + (Number(classeBonus[key]) || 0) + (Number(tracosBonus[key]) || 0);
      if (bonus !== 0) acc[key] = bonus;
      return acc;
    }, {});
  }, [racaId, classeId, vantagensIds, desvantagensIds, racasDisponiveis, classesDisponiveis, vantagensDisponiveis]);

  const atributosFinal = useMemo(() => {
    const result = { ...atributosBase };
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

  const setAtributo = useCallback((key, value) => {
    if (!BONUS_ATTR_KEYS.includes(key)) return;
    const val = Math.min(ATTR_MAX, Math.max(ATTR_MIN, Number(value) || ATTR_MIN));
    setAtributosBase((prev) => ({ ...prev, [key]: val }));
  }, []);

  const aplicarAtributosSugeridos = useCallback(() => {
    const resultado = normalizarAtributosSugeridos(atributosSugeridos);
    if (!resultado.applied) return resultado;
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
