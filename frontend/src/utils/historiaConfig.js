export const VELOCIDADES_NARRATIVA = [
  {
    value: 'lento',
    label: 'Lento',
    desc: 'Mais exploracao e dialogo antes de escalar conflitos. Ideal para campanhas contemplativas.'
  },
  {
    value: 'medio',
    label: 'Medio',
    desc: 'Equilibrio entre ambientacao, descoberta e conflito. Melhor para a maioria das historias.'
  },
  {
    value: 'rapido',
    label: 'Rapido',
    desc: 'Avanca rapido para decisao e consequencia. Menos desvio, mais urgencia.'
  }
];

export const OPCOES_ORCAMENTO_BEATS = [6, 8, 10, 12, 16, 20, 24];
export const OPCOES_MAX_ACOES_TURNO = [2, 3, 4, 5, 6];

export const DEFAULT_HISTORIA_CONFIG = {
  ritmo: {
    velocidade: 'medio',
    orcamento_de_beats: 12
  },
  regras_de_turno: {
    max_acoes_por_turno: 4
  }
};

export function resolveHistoriaConfig(config = null) {
  return {
    ...DEFAULT_HISTORIA_CONFIG,
    ...(config || {}),
    ritmo: {
      ...DEFAULT_HISTORIA_CONFIG.ritmo,
      ...(config?.ritmo || {})
    },
    regras_de_turno: {
      ...DEFAULT_HISTORIA_CONFIG.regras_de_turno,
      ...(config?.regras_de_turno || {})
    }
  };
}

export function mergeHistoriaConfig(baseConfig = null, patchConfig = null) {
  return resolveHistoriaConfig({
    ...(baseConfig || {}),
    ...(patchConfig || {}),
    ritmo: {
      ...(baseConfig?.ritmo || {}),
      ...(patchConfig?.ritmo || {})
    },
    regras_de_turno: {
      ...(baseConfig?.regras_de_turno || {}),
      ...(patchConfig?.regras_de_turno || {})
    }
  });
}
