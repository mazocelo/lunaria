// src/Pages/Personagem/Wizard/stages/stageScreen.ts
export type StageScreen = 'nome' | 'catalogo-raca' | 'catalogo-classe' | 'legado';

/** Fase 1: Nome, Raça e Classe têm tela própria; o resto roda no LegacyStageAdapter. */
export function telaDaEtapa(etapaId: string, _sistema: string): StageScreen {
  switch (etapaId) {
    case 'boas_vindas': return 'nome';
    case 'raca': return 'catalogo-raca';
    case 'classe': return 'catalogo-classe';
    default: return 'legado';
  }
}
