import { useState, useRef, useCallback } from 'react';

const DRAFT_KEY = 'lunaria_wizard_draft_v2';

export interface WizardDraft {
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
  [key: string]: unknown;
}

function loadDraftFromStorage(): WizardDraft | null {
  try {
    localStorage.removeItem('lunaria_wizard_draft_v1');
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch { return null; }
}

/**
 * Gerencia persistência de rascunho do wizard em localStorage.
 * Responsabilidades: load, save, clear, flag de restauração.
 */
export const useDraftPersistence = () => {
  const draft = useRef<WizardDraft | null>(loadDraftFromStorage());
  const [draftRestaurado, setDraftRestaurado] = useState(false);

  /** Salva estado atual como draft v2 */
  const salvarDraft = useCallback((state: WizardDraft) => {
    if (state.etapaAtual === 'boas_vindas' && !state.nome) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        etapaAtual: state.etapaAtual,
        nome: state.nome,
        racaId: state.racaId,
        racaNome: state.racaNome,
        classeId: state.classeId,
        classeNome: state.classeNome,
        background: state.background,
        vantagensIds: state.vantagensIds,
        vantagensNomes: state.vantagensNomes,
        desvantagensIds: state.desvantagensIds,
        desvantagensNomes: state.desvantagensNomes,
        atributosBase: state.atributosBase,
        bonusAplicados: state.bonusAplicados,
        skipVantagens: state.skipVantagens,
        skipDesvantagens: state.skipDesvantagens,
        etapasVisitadas: state.etapasVisitadas,
        etapasConcluidas: state.etapasConcluidas,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, []);

  /** Limpa draft do localStorage */
  const limparDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }, []);

  return {
    draftInicial: draft.current,
    draftRestaurado,
    setDraftRestaurado,
    salvarDraft,
    limparDraft,
  };
};

export type DraftPersistenceApi = ReturnType<typeof useDraftPersistence>;
