export type VelocidadeNarrativa = 'lento' | 'medio' | 'rapido';

export interface VelocidadeOption {
  value: VelocidadeNarrativa;
  label: string;
  desc: string;
}

export interface HistoriaRitmoConfig {
  velocidade: VelocidadeNarrativa;
  orcamento_de_beats: number;
}

export interface HistoriaRegrasTurnoConfig {
  max_acoes_por_turno: number;
}

/**
 * Shape do `historia.config` — keys conhecidas + passthrough via index
 * signature porque o backend grava campos adicionais (ex.: `session_opening_mode`
 * usado em `historia-ver.model.js`) que ainda nao tem schema dedicado.
 */
export interface HistoriaConfig {
  ritmo: HistoriaRitmoConfig;
  regras_de_turno: HistoriaRegrasTurnoConfig;
  [key: string]: unknown;
}

export const VELOCIDADES_NARRATIVA: readonly VelocidadeOption[] = [
  {
    value: 'lento',
    label: 'Lento',
    desc: 'Mais exploracao e dialogo antes de escalar conflitos. Ideal para campanhas contemplativas.',
  },
  {
    value: 'medio',
    label: 'Medio',
    desc: 'Equilibrio entre ambientacao, descoberta e conflito. Melhor para a maioria das historias.',
  },
  {
    value: 'rapido',
    label: 'Rapido',
    desc: 'Avanca rapido para decisao e consequencia. Menos desvio, mais urgencia.',
  },
];

export const OPCOES_ORCAMENTO_BEATS: readonly number[] = [6, 8, 10, 12, 16, 20, 24];
export const OPCOES_MAX_ACOES_TURNO: readonly number[] = [2, 3, 4, 5, 6];

export const DEFAULT_HISTORIA_CONFIG: HistoriaConfig = {
  ritmo: {
    velocidade: 'medio',
    orcamento_de_beats: 12,
  },
  regras_de_turno: {
    max_acoes_por_turno: 4,
  },
};

/**
 * Entrada tolerante — callers passam tanto `historia.config` parcial quanto
 * `null`/`undefined`. Mantemos shape aberto para nao quebrar fichas antigas.
 */
type HistoriaConfigInput = Partial<HistoriaConfig> | null | undefined;

export function resolveHistoriaConfig(config: HistoriaConfigInput = null): HistoriaConfig {
  return {
    ...DEFAULT_HISTORIA_CONFIG,
    ...(config || {}),
    ritmo: {
      ...DEFAULT_HISTORIA_CONFIG.ritmo,
      ...(config?.ritmo || {}),
    },
    regras_de_turno: {
      ...DEFAULT_HISTORIA_CONFIG.regras_de_turno,
      ...(config?.regras_de_turno || {}),
    },
  };
}

export function mergeHistoriaConfig(
  baseConfig: HistoriaConfigInput = null,
  patchConfig: HistoriaConfigInput = null
): HistoriaConfig {
  return resolveHistoriaConfig({
    ...(baseConfig || {}),
    ...(patchConfig || {}),
    ritmo: {
      ...(baseConfig?.ritmo || {}),
      ...(patchConfig?.ritmo || {}),
    } as HistoriaRitmoConfig,
    regras_de_turno: {
      ...(baseConfig?.regras_de_turno || {}),
      ...(patchConfig?.regras_de_turno || {}),
    } as HistoriaRegrasTurnoConfig,
  });
}
