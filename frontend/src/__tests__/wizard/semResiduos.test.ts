// src/__tests__/wizard/semResiduos.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const RAIZ = 'src/Pages/Personagem/Wizard'; // o vitest roda da raiz do projeto

/** Arquivos que já usam só tokens globais. Cada tarefa de restilização acrescenta os seus. */
const ARQUIVOS_LIMPOS = [
  'components/HeroStrip.tsx',
  'components/Stepper.tsx',
  'components/StageFrame.tsx',
  'components/WizardFooter.tsx',
  'components/MestrePanel.tsx',
  'stages/NomeStage.tsx',
  'stages/CatalogStage.tsx',
  'stages/OrcamentoBar.tsx',
  'stages/BackgroundStage.tsx',
  'components/AtributoTile.tsx',
  'components/AttributeDistributor.tsx',
  'stages/AtributosStage.tsx',
  'components/EquipamentosBlock.tsx',
  'components/GrimorioBlock.tsx',
  'components/DnDAbilityScoreBlock.tsx',
  'components/DnDSkillsBlock.tsx',
  'components/DestinoResolutivaBlock.tsx',
  'stages/ResumoStage.tsx',
];

const PROIBIDOS: Array<[string, RegExp]> = [
  ['classe wa-*', /(?<![\w-])wa-[a-z]/],
  ['variável --wa-*', /--wa-/],
  ['wizard-atelier', /wizard-atelier/],
  ['wizard-theme.css', /wizard-theme\.css/],
  ['fonte mono', /font-mono/],
  ['rótulo uppercase', /\buppercase\b/],
  ['roxo fixo', /\b(?:bg|text|border|from|to|ring|via)-(?:purple|violet)-\d/],
];

describe('wizard sem resíduos do tema paralelo', () => {
  it.each(ARQUIVOS_LIMPOS)('%s', (arquivo) => {
    const fonte = readFileSync(`${RAIZ}/${arquivo}`, 'utf8');
    for (const [nome, re] of PROIBIDOS) expect(fonte, `${arquivo}: ${nome}`).not.toMatch(re);
  });
});
