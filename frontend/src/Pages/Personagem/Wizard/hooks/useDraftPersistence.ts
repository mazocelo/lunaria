import { useState, useRef, useCallback } from 'react';

const PREFIXO = 'lunaria_wizard_draft_v3_';
/** Chave única de antes do D&D: só havia Lunaria em produção, então só migra para lunaria. */
const CHAVE_V2 = 'lunaria_wizard_draft_v2';

export interface WizardDraft {
  sistema?: string;
  versao?: number;
  etapaAtual?: string;
  nome?: string;
  racaId?: number | string | null;
  racaNome?: string | null;
  classeId?: number | string | null;
  classeNome?: string | null;
  background?: string;
  vantagensIds?: Array<number | string>;
  vantagensNomes?: string[];
  desvantagensIds?: Array<number | string>;
  desvantagensNomes?: string[];
  atributosBase?: Record<string, number>;
  bonusAplicados?: boolean;
  skipVantagens?: boolean;
  skipDesvantagens?: boolean;
  etapasVisitadas?: string[];
  etapasConcluidas?: string[];
  dndAbilityScores?: Record<string, number | null>;
  dndAbilitiesConfirmed?: boolean;
  dndSkillProficiencies?: string[];
  dndSkillsConfirmed?: boolean;
  grimorioSelecionadas?: Array<number | string>;
  grimorioConfirmado?: boolean;
  imageUrl?: string | null;
  [key: string]: unknown;
}

type Leitura = Pick<Storage, 'getItem' | 'removeItem'> & Partial<Pick<Storage, 'setItem'>>;

export const chaveDoRascunho = (sistema: string) => `${PREFIXO}${sistema}`;

const parse = (raw: string | null): WizardDraft | null => {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as WizardDraft) : null;
  } catch { return null; }
};

/** Rascunho do sistema pedido; nunca devolve o de outro sistema. */
export function lerRascunho(sistema: string, storage: Leitura = localStorage): WizardDraft | null {
  try {
    storage.removeItem('lunaria_wizard_draft_v1');
    const atual = parse(storage.getItem(chaveDoRascunho(sistema)));
    if (atual) return atual.sistema === sistema ? atual : null;
    if (sistema !== 'lunaria') return null;
    const velho = parse(storage.getItem(CHAVE_V2));
    if (!velho) return null;
    const migrado: WizardDraft = { ...velho, sistema: 'lunaria', versao: 3 };
    // Grava na chave nova antes de apagar a velha: uma segunda leitura (StrictMode) acha o migrado.
    storage.setItem?.(chaveDoRascunho('lunaria'), JSON.stringify(migrado));
    storage.removeItem(CHAVE_V2);
    return migrado;
  } catch { return null; }
}

/** Resumo para o banner/seletor de sistema, sem migrar nem apagar nada. */
export function existeRascunho(sistema: string, storage: Pick<Storage, 'getItem'> = localStorage): { nome: string; etapa: string } | null {
  try {
    const d = parse(storage.getItem(chaveDoRascunho(sistema)));
    return d && d.sistema === sistema ? { nome: d.nome ?? '', etapa: d.etapaAtual ?? 'boas_vindas' } : null;
  } catch { return null; }
}

/** Grava o estado inteiro (D&D, grimório e retrato inclusos). Rascunho vazio na abertura não é gravado. */
export function gravarRascunho(sistema: string, state: WizardDraft, storage: Pick<Storage, 'setItem'> = localStorage): void {
  if (state.etapaAtual === 'boas_vindas' && !state.nome) return;
  try {
    storage.setItem(chaveDoRascunho(sistema), JSON.stringify({ ...state, sistema, versao: 3 }));
  } catch { /* quota excedida: ignora */ }
}

export interface Saneamento {
  zerarRaca: boolean;
  zerarClasse: boolean;
  /** Etapa para onde o rascunho volta, se a escolha caiu. */
  voltarPara: 'raca' | 'classe' | null;
}

/**
 * Raça/classe do rascunho que não existe no catálogo do sistema (cadastro apagado,
 * rascunho antigo) cai e o wizard volta para a etapa dela. Catálogo `null` = ainda
 * não conhecido por inteiro: não derruba nada.
 */
export function saneamentoDoRascunho(
  escolha: { racaId: number | string | null; classeId: number | string | null },
  racasIds: Array<number | string> | null,
  classesIds: Array<number | string> | null,
): Saneamento {
  const fora = (id: number | string | null, ids: Array<number | string> | null) =>
    id != null && ids != null && !ids.some((i) => String(i) === String(id));
  const zerarRaca = fora(escolha.racaId, racasIds);
  const zerarClasse = fora(escolha.classeId, classesIds);
  return { zerarRaca, zerarClasse, voltarPara: zerarRaca ? 'raca' : zerarClasse ? 'classe' : null };
}

/**
 * Rascunho do wizard em localStorage, uma chave por sistema.
 * Responsabilidades: load, save, clear, flag de restauração.
 */
export const useDraftPersistence = (sistema: string) => {
  const draft = useRef<WizardDraft | null | undefined>(undefined);
  if (draft.current === undefined) draft.current = lerRascunho(sistema);
  const [draftRestaurado, setDraftRestaurado] = useState(false);

  const salvarDraft = useCallback((state: WizardDraft) => gravarRascunho(sistema, state), [sistema]);

  const limparDraft = useCallback(() => {
    try { localStorage.removeItem(chaveDoRascunho(sistema)); } catch { /* ignora */ }
  }, [sistema]);

  return { draftInicial: draft.current, draftRestaurado, setDraftRestaurado, salvarDraft, limparDraft };
};

export type DraftPersistenceApi = ReturnType<typeof useDraftPersistence>;
