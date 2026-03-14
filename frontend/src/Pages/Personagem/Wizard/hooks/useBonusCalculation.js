import { useState, useMemo, useCallback } from 'react';

const PONTOS_TOTAIS = 60;
const ATTR_MIN = 5;
const ATTR_MAX = 16;
const ATTR_KEYS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

const ATRIBUTOS_INICIAIS = {
  forca: 10, destreza: 10, constituicao: 10,
  inteligencia: 10, agilidade: 10, carisma: 10,
};

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

function parseRacaClasseBonus(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(obj) ? obj[0] : obj;
  } catch { return null; }
}

/**
 * Gerencia cálculo de bônus e atributos.
 * Responsabilidades: atributosBase, bonusDetalhes, atributosFinal, confirmação.
 * Nota: invalidação de bônus por mudança de build fica no wizard.model.js
 * (precisa de etapaAtual que vem de useWizardNavigation — evitar dependência circular).
 */
export const useBonusCalculation = ({
  draftInicial,
  racaId, classeId, vantagensIds, desvantagensIds,
  racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
}) => {
  // atributosBase — distribuição do jogador (60 pontos)
  const [atributosBase, setAtributosBase] = useState(
    draftInicial?.atributosBase || { ...ATRIBUTOS_INICIAIS }
  );

  const [bonusAplicados, setBonusAplicados] = useState(draftInicial?.bonusAplicados || false);
  const [bonusInvalidado, setBonusInvalidado] = useState(false);
  const [atributosSugeridos, setAtributosSugeridos] = useState(null);

  // Bônus calculado como derivação pura
  const bonusDetalhes = useMemo(() => {
    const racaObj = racasDisponiveis.find(r => String(r.id) === String(racaId));
    const classeObj = classesDisponiveis.find(c => String(c.id) === String(classeId));
    const racaBonus = parseRacaClasseBonus(racaObj?.bonus);
    const classeBonus = parseRacaClasseBonus(classeObj?.bonus);

    const bonus = {};
    for (const key of ATTR_KEYS) {
      let b = 0;
      if (racaBonus && (typeof racaBonus[key] === 'string' || typeof racaBonus[key] === 'number')) {
        b += Number(racaBonus[key]) || 0;
      }
      if (classeBonus && (typeof classeBonus[key] === 'string' || typeof classeBonus[key] === 'number')) {
        b += Number(classeBonus[key]) || 0;
      }
      if (b !== 0) bonus[key] = b;
    }

    // Vantagens/desvantagens bonus
    const allItems = vantagensDisponiveis || [];
    const selectedIds = [...vantagensIds, ...desvantagensIds];
    for (const id of selectedIds) {
      const item = allItems.find(v => String(v.id) === String(id));
      if (!item?.bonus) continue;
      const bonusArr = Array.isArray(item.bonus) ? item.bonus : [item.bonus];
      for (const entry of bonusArr) {
        if (entry?.atributo && ATTR_KEYS.includes(entry.atributo)) {
          bonus[entry.atributo] = (bonus[entry.atributo] || 0) + (Number(entry.valor) || 0);
        }
      }
    }

    for (const key of Object.keys(bonus)) {
      if (bonus[key] === 0) delete bonus[key];
    }
    return bonus;
  }, [racaId, classeId, racasDisponiveis, classesDisponiveis, vantagensIds, desvantagensIds, vantagensDisponiveis]);

  // atributosFinal = atributosBase + bônus
  const atributosFinal = useMemo(() => {
    const result = { ...atributosBase };
    for (const [key, val] of Object.entries(bonusDetalhes)) {
      result[key] = (result[key] || 10) + val;
    }
    return result;
  }, [atributosBase, bonusDetalhes]);

  // Pontos = diferença entre soma atual e baseline (60)
  const somaAtual = useMemo(() => somaAtributos(atributosBase), [atributosBase]);
  const pontosDistribuidos = somaAtual - PONTOS_TOTAIS; // 0 no início, positivo ao subir atributos
  const pontosRestantes = PONTOS_TOTAIS - somaAtual;    // 60 → 0 conforme distribui

  /** Confirma atributos */
  const confirmarAtributos = useCallback(() => {
    if (bonusAplicados) return;
    setBonusAplicados(true);
    setBonusInvalidado(false);
  }, [bonusAplicados]);

  /** Atualiza um atributo individual (opera sobre atributosBase) */
  const setAtributo = useCallback((key, value) => {
    if (!ATTR_KEYS.includes(key)) return;
    const val = Math.min(ATTR_MAX, Math.max(ATTR_MIN, Number(value) || ATTR_MIN));
    setAtributosBase(prev => ({ ...prev, [key]: val }));
  }, []);

  /** Aplica sugestão de atributos da IA */
  const aplicarAtributosSugeridos = useCallback(() => {
    if (atributosSugeridos) {
      setAtributosBase({ ...atributosSugeridos });
    }
  }, [atributosSugeridos]);

  /** Reseta atributos ao estado inicial */
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
