/**
 * stageSelectors.js — Funcoes puras de leitura do estado do wizard
 *
 * Nenhuma dessas funcoes causa side effects. Recebem buildState e retornam dados derivados.
 * Suporta sistemas: lunaria (padrao), tresdet (3D&T Alpha) e dnd5e (D&D 5e).
 */
import { getStageConfig, getSystemStages } from './stageConfig';
import type { StageConfig } from './stageConfig';

export interface BuildState {
  nome?: string;
  background?: string;
  racaId?: number | string | null;
  classeId?: number | string | null;
  racaAtual?: { nome?: string } | null;
  classeAtual?: { nome?: string } | null;
  vantagensIds?: Array<number | string>;
  desvantagensIds?: Array<number | string>;
  skipVantagens?: boolean;
  skipDesvantagens?: boolean;
  vantagensSelecionadas?: boolean | unknown;
  desvantagensSelecionadas?: boolean | unknown;
  caracteristicasDistribuidas?: boolean;
  magiasSelecionadas?: boolean | unknown;
  bonusAplicados?: boolean;
  bonusInvalidado?: boolean;
  comboPreviewData?: unknown;
  grimorioSelecionado?: unknown;
  dndAbilitiesConfirmed?: boolean;
  dndSkillsConfirmed?: boolean;
  podeCriar?: boolean;
  orcamentoCriacaoValido?: boolean;
  pontosCriacaoRestantes?: number;
  [key: string]: unknown;
}

function getStagesForSystem(sistema: string | undefined): StageConfig[] {
  return getSystemStages(sistema).stages;
}

/**
 * Checa se uma etapa esta concluida.
 */
export function isStageDone(stageId: string, buildState: BuildState, sistema?: string): boolean {
  if (sistema === 'tresdet') {
    switch (stageId) {
      case 'boas_vindas': return !!buildState.nome?.trim();
      case 'conceito': return !!buildState.background?.trim();
      case 'caracteristicas': return !!buildState.caracteristicasDistribuidas;
      case 'vantagens': return !!buildState.vantagensSelecionadas || !!buildState.skipVantagens;
      case 'desvantagens': return !!buildState.desvantagensSelecionadas || !!buildState.skipDesvantagens;
      case 'equipamentos': return !!buildState.comboPreviewData;
      case 'magias': return !!buildState.magiasSelecionadas;
      case 'resumo': return false;
      default: return false;
    }
  }

  if (sistema === 'dnd5e') {
    switch (stageId) {
      case 'boas_vindas': return !!buildState.nome?.trim();
      case 'raca': return !!buildState.racaId;
      case 'classe': return !!buildState.classeId;
      case 'background': return !!buildState.background?.trim();
      case 'atributos': return !!buildState.dndAbilitiesConfirmed;
      case 'skills': return !!buildState.dndSkillsConfirmed;
      case 'resumo': return false;
      default: return false;
    }
  }

  switch (stageId) {
    case 'boas_vindas': return !!buildState.nome?.trim();
    case 'raca': return !!buildState.racaId;
    case 'classe': return !!buildState.classeId;
    case 'background': return !!buildState.background?.trim();
    case 'desvantagens': return (buildState.desvantagensIds?.length ?? 0) > 0 || !!buildState.skipDesvantagens;
    case 'vantagens': return (buildState.vantagensIds?.length ?? 0) > 0 || !!buildState.skipVantagens;
    case 'atributos': return !!buildState.bonusAplicados;
    case 'equipamentos': return !!buildState.comboPreviewData;
    case 'grimorio': return !!buildState.grimorioSelecionado;
    case 'resumo': return false;
    default: return false;
  }
}

/**
 * Checa se uma etapa foi pulada.
 */
export function isStageSkipped(stageId: string, buildState: BuildState): boolean {
  if (stageId === 'vantagens') return !!buildState.skipVantagens;
  if (stageId === 'desvantagens') return !!buildState.skipDesvantagens;
  return false;
}

/**
 * Retorna tooltip contextual de uma etapa.
 */
export function getStageTooltip(stageId: string, buildState: BuildState, sistema?: string): string {
  const { nome, racaAtual, classeAtual, background, vantagensIds, desvantagensIds,
          skipVantagens, skipDesvantagens, bonusAplicados, bonusInvalidado, podeCriar } = buildState;

  if (sistema === 'tresdet') {
    switch (stageId) {
      case 'boas_vindas': return nome?.trim() || 'Nome pendente';
      case 'conceito': return background?.trim() ? 'Conceito definido' : 'Conceito pendente';
      case 'caracteristicas': return buildState.caracteristicasDistribuidas ? 'Caracteristicas confirmadas' : 'Caracteristicas pendentes';
      case 'vantagens':
        if (buildState.vantagensSelecionadas) return 'Vantagens confirmadas';
        if (skipVantagens) return 'Etapa pulada';
        return 'Vantagens pendentes';
      case 'desvantagens':
        if (buildState.desvantagensSelecionadas) return 'Desvantagens confirmadas';
        if (skipDesvantagens) return 'Etapa pulada';
        return 'Desvantagens pendentes';
      case 'equipamentos': return buildState.comboPreviewData ? 'Equipamentos definidos' : 'Equipamentos pendentes';
      case 'magias': return buildState.magiasSelecionadas ? 'Magias selecionadas' : 'Magias pendentes';
      case 'resumo': return podeCriar ? 'Pronto para selar' : 'Em preparo';
      default: return '';
    }
  }

  if (sistema === 'dnd5e') {
    switch (stageId) {
      case 'boas_vindas': return nome?.trim() || 'Nome pendente';
      case 'raca': return racaAtual?.nome || 'Raca pendente';
      case 'classe': return classeAtual?.nome || 'Classe pendente';
      case 'background': return background?.trim() ? 'Antecedente definido' : 'Antecedente pendente';
      case 'atributos': return buildState.dndAbilitiesConfirmed ? 'Atributos confirmados' : 'Atributos pendentes';
      case 'skills': return buildState.dndSkillsConfirmed ? 'Pericias confirmadas' : 'Pericias pendentes';
      case 'resumo': return podeCriar ? 'Pronto para selar' : 'Em preparo';
      default: return '';
    }
  }

  switch (stageId) {
    case 'boas_vindas': return nome?.trim() || 'Nome pendente';
    case 'raca': return racaAtual?.nome || 'Linhagem pendente';
    case 'classe': return classeAtual?.nome || 'Vocacao pendente';
    case 'background': return background?.trim() ? 'Origem definida' : 'Origem pendente';
    case 'desvantagens':
      if ((desvantagensIds?.length ?? 0) > 0) return `${desvantagensIds!.length} marcas fixadas`;
      if (skipDesvantagens) return 'Etapa pulada';
      return 'Marcas pendentes';
    case 'vantagens':
      if ((vantagensIds?.length ?? 0) > 0) return `${vantagensIds!.length} dons fixados`;
      if (skipVantagens) return 'Etapa pulada';
      return 'Dons pendentes';
    case 'atributos':
      if (bonusAplicados) return 'Calibrados e confirmados';
      if (bonusInvalidado) return 'Revisao necessaria';
      return 'Leitura pendente';
    case 'equipamentos': return buildState.comboPreviewData ? 'Arsenal definido' : 'Arsenal pendente';
    case 'grimorio': return buildState.grimorioSelecionado ? 'Magias selecionadas' : 'Magias pendentes';
    case 'resumo': return podeCriar ? 'Resolutiva pronta para selar' : 'Resolutiva em preparo';
    default: return '';
  }
}

/**
 * Retorna lista de items de progresso para a sidebar.
 */
export function getProgressItems(buildState: BuildState, sistema?: string) {
  const stages = getStagesForSystem(sistema);
  return stages
    .filter((s) => s.progressLabel)
    .map((s) => ({
      label: s.progressLabel,
      done: isStageDone(s.id, buildState, sistema),
      skipped: isStageSkipped(s.id, buildState),
    }));
}

/**
 * Retorna tooltipMap completo para todas as etapas.
 */
export function getTooltipMap(buildState: BuildState, sistema?: string): Record<string, string> {
  const stages = getStagesForSystem(sistema);
  const map: Record<string, string> = {};
  for (const s of stages) {
    map[s.id] = getStageTooltip(s.id, buildState, sistema);
  }
  return map;
}

/**
 * Retorna readiness state global do wizard.
 */
export function getReadinessState(buildState: BuildState, sistema?: string): 'open' | 'shaping' | 'sealed' {
  if (sistema === 'tresdet') {
    const { nome, background, caracteristicasDistribuidas } = buildState;
    if (!nome?.trim() || !background?.trim()) return 'open';
    if (!caracteristicasDistribuidas) return 'shaping';
    return 'sealed';
  }

  if (sistema === 'dnd5e') {
    const { nome, racaId, classeId } = buildState;
    if (!nome?.trim() || !racaId || !classeId) return 'open';
    if (getPendingCount(buildState, sistema) > 0) return 'shaping';
    return 'sealed';
  }

  const { nome, racaId, classeId, bonusInvalidado } = buildState;
  if (!nome?.trim() || !racaId || !classeId) return 'open';
  if (getPendingCount(buildState, sistema) > 0 || bonusInvalidado) return 'shaping';
  return 'sealed';
}

/**
 * Conta itens pendentes obrigatorios + opcionais.
 */
export function getPendingCount(buildState: BuildState, sistema?: string): number {
  if (sistema === 'tresdet') {
    const { nome, background, caracteristicasDistribuidas,
            vantagensSelecionadas, desvantagensSelecionadas,
            skipVantagens, skipDesvantagens } = buildState;
    const obrigatorios = [
      !nome?.trim(),
      !background?.trim(),
      !caracteristicasDistribuidas,
    ].filter(Boolean).length;
    const opcionais = Number(!vantagensSelecionadas && !skipVantagens)
      + Number(!desvantagensSelecionadas && !skipDesvantagens);
    return obrigatorios + opcionais;
  }

  if (sistema === 'dnd5e') {
    const { nome, racaId, classeId, background,
            dndAbilitiesConfirmed, dndSkillsConfirmed } = buildState;
    return [
      !nome?.trim(),
      !racaId,
      !classeId,
      !background?.trim(),
      !dndAbilitiesConfirmed,
      !dndSkillsConfirmed,
    ].filter(Boolean).length;
  }

  const { nome, racaId, classeId, background, bonusAplicados,
          vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens,
          orcamentoCriacaoValido } = buildState;

  const obrigatorios = [
    !nome?.trim(),
    !racaId,
    !classeId,
    !background?.trim(),
    !bonusAplicados,
    orcamentoCriacaoValido === false,
  ].filter(Boolean).length;

  const opcionais = Number(vantagensIds?.length === 0 && !skipVantagens)
    + Number(desvantagensIds?.length === 0 && !skipDesvantagens);

  return obrigatorios + opcionais;
}

/**
 * Checa se o personagem pode ser criado.
 */
export function canCreate(buildState: BuildState, sistema?: string): boolean {
  if (sistema === 'tresdet') {
    const { nome, background, caracteristicasDistribuidas } = buildState;
    return !!(nome?.trim() && background?.trim() && caracteristicasDistribuidas);
  }

  if (sistema === 'dnd5e') {
    const { nome, racaId, classeId, background,
            dndAbilitiesConfirmed, dndSkillsConfirmed } = buildState;
    return !!(
      nome?.trim()
      && racaId
      && classeId
      && background?.trim()
      && dndAbilitiesConfirmed
      && dndSkillsConfirmed
    );
  }

  const { nome, racaId, classeId, background, bonusAplicados, pontosCriacaoRestantes } = buildState;
  return !!(
    nome?.trim()
    && racaId
    && classeId
    && background?.trim()
    && bonusAplicados
    && (pontosCriacaoRestantes ?? 0) >= 0
  );
}

/**
 * Retorna label de continue contextual para a etapa.
 */
export function getContinueLabel(stageId: string, sistema?: string): string {
  const config = getStageConfig(stageId, sistema);
  return config.continueLabel || 'Continuar';
}

/**
 * Checa se continue esta disponivel na etapa com base no buildState.
 */
export function canContinueStage(stageId: string, buildState: BuildState, sistema?: string): boolean {
  if (sistema === 'tresdet') {
    if (stageId === 'caracteristicas') return !!buildState.caracteristicasDistribuidas;
    if (stageId === 'vantagens') return !!buildState.vantagensSelecionadas || !!buildState.skipVantagens;
    if (stageId === 'desvantagens') return !!buildState.desvantagensSelecionadas || !!buildState.skipDesvantagens;
    if (stageId === 'magias') return !!buildState.magiasSelecionadas;
    return false;
  }

  if (sistema === 'dnd5e') {
    if (stageId === 'atributos') return !!buildState.dndAbilitiesConfirmed;
    if (stageId === 'skills') return !!buildState.dndSkillsConfirmed;
    return false;
  }

  if (stageId === 'desvantagens') {
    return (buildState.desvantagensIds?.length ?? 0) > 0 || !!buildState.skipDesvantagens;
  }
  if (stageId === 'vantagens') {
    return (buildState.vantagensIds?.length ?? 0) > 0 || !!buildState.skipVantagens;
  }
  if (stageId === 'atributos') {
    return !!buildState.bonusAplicados;
  }
  if (stageId === 'grimorio') {
    return !!buildState.grimorioSelecionado;
  }
  return false;
}
